"use strict";

/*
 * PahaePoster - processus principal Electron.
 *
 * 1. Démarre server.js (Next.js + WebSocket) dans un processus enfant,
 *    en utilisant l'exécutable Electron comme runtime Node.js
 *    (ELECTRON_RUN_AS_NODE) pour que better-sqlite3 (compilé pour Electron)
 *    fonctionne.
 * 2. Attend que le serveur réponde, puis ouvre la fenêtre.
 * 3. Arrête proprement le serveur à la fermeture.
 *
 * Données utilisateur (SQLite, sessions Sharer, clé de chiffrement, logs) :
 *   Windows : %APPDATA%\PahaePoster
 */

const { app, BrowserWindow, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const http = require("http");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

// Port FIXE : le localStorage (diagrammes Classer, thème) est lié à l'origine
// http://127.0.0.1:<port>. Changer de port ferait "disparaître" ces données.
const PORT = Number(process.env.PAHAE_PORT) || 5555;
const HOST = "127.0.0.1";
const APP_ROOT = __dirname;
const START_TIMEOUT_MS = 90000;

let mainWindow = null;
let serverProcess = null;
let serverReady = false;
let quitting = false;
let logStream = null;
let recentOutput = "";

app.setAppUserModelId("com.pahae.pahaeposter");

/* ------------------------------ Utilitaires ------------------------------ */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function userDir(...parts) {
  return path.join(app.getPath("userData"), ...parts);
}

function openLog() {
  try {
    const dir = userDir("logs");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "pahaeposter.log");
    try {
      if (fs.statSync(file).size > 2 * 1024 * 1024) {
        fs.renameSync(file, path.join(dir, "pahaeposter.old.log"));
      }
    } catch (_) {
      /* fichier absent : normal */
    }
    logStream = fs.createWriteStream(file, { flags: "a" });
    return file;
  } catch (_) {
    return null;
  }
}

function log(prefix, text) {
  const line = `[${new Date().toISOString()}] ${prefix} ${String(text).trimEnd()}\n`;
  process.stdout.write(line);
  if (logStream) logStream.write(line);
  recentOutput = (recentOutput + line).slice(-3000);
}

/**
 * Clé de chiffrement des mots de passe stockés (AES-256-GCM dans lib/crypto.js).
 * Générée une seule fois puis conservée dans le dossier utilisateur.
 * Ne JAMAIS la régénérer si le fichier existe : les mots de passe déjà
 * enregistrés deviendraient illisibles.
 */
function getEncryptionKey() {
  if (process.env.ENCRYPTION_KEY) return process.env.ENCRYPTION_KEY;

  const keyFile = userDir("secret.key");
  if (fs.existsSync(keyFile)) {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (!existing) {
      throw new Error(`Le fichier de clé est vide : ${keyFile}`);
    }
    return existing;
  }

  fs.mkdirSync(path.dirname(keyFile), { recursive: true });
  const key = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(keyFile, key, { encoding: "utf8", mode: 0o600, flag: "wx" });
  return key;
}

/* --------------------------------- Réseau -------------------------------- */

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: HOST });
    socket.setTimeout(700);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function canListen(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port); // mêmes paramètres que server.js (toutes interfaces)
  });
}

async function assertPortAvailable(port) {
  if ((await canConnect(port)) || !(await canListen(port))) {
    throw new Error(
      `Le port ${port} est déjà utilisé.\n\n` +
        "Fermez l'autre programme qui l'utilise (par exemple « npm run dev » " +
        "ou une autre instance de PahaePoster) puis relancez l'application."
    );
  }
}

function pingOnce(port) {
  return new Promise((resolve) => {
    const request = http.get({ host: HOST, port, path: "/", timeout: 2000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.once("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.once("error", () => resolve(false));
  });
}

async function waitForServer(child, port) {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Le serveur s'est arrêté au démarrage (code ${child.exitCode}).\n\n${recentOutput.slice(-800)}`
      );
    }
    if (await pingOnce(port)) return;
    await sleep(400);
  }
  throw new Error(`Le serveur n'a pas répondu sur le port ${port} après ${START_TIMEOUT_MS / 1000} s.`);
}

/* --------------------------------- Serveur ------------------------------- */

async function startServer() {
  const serverPath = path.join(APP_ROOT, "server.js");
  if (!fs.existsSync(path.join(APP_ROOT, ".next", "BUILD_ID"))) {
    throw new Error("Build Next.js introuvable (.next). Lancez d'abord « npm run build ».");
  }

  await assertPortAvailable(PORT);

  const dataDir = userDir("data");
  fs.mkdirSync(path.join(dataDir, "sessions"), { recursive: true });

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    PORT: String(PORT),
    DATA_DIR: dataDir,
    DATABASE_PATH: path.join(dataDir, "pahaeposter.sqlite"),
    ENCRYPTION_KEY: getEncryptionKey()
  };

  log("[APP]", `Démarrage du serveur : ${serverPath} (port ${PORT})`);
  log("[APP]", `Données : ${dataDir}`);

  const child = spawn(process.execPath, [serverPath], {
    cwd: APP_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  serverProcess = child;

  child.stdout.on("data", (data) => log("[SERVER]", data));
  child.stderr.on("data", (data) => log("[SERVER ERROR]", data));
  child.once("error", (error) => log("[APP]", `Erreur de lancement du serveur : ${error.message}`));
  child.once("exit", (code, signal) => {
    log("[APP]", `Serveur arrêté (code ${code}, signal ${signal})`);
    if (serverReady && !quitting) {
      dialog.showErrorBox(
        "PahaePoster",
        "Le serveur interne s'est arrêté de façon inattendue. L'application va se fermer."
      );
      app.quit();
    }
  });

  await waitForServer(child, PORT);
  serverReady = true;
  log("[APP]", "Serveur prêt.");
}

function stopServer() {
  const child = serverProcess;
  serverProcess = null;
  if (!child || child.exitCode !== null) return;

  try {
    child.kill();
  } catch (_) {
    /* déjà arrêté */
  }
  if (process.platform === "win32" && child.pid) {
    try {
      spawnSync("taskkill", ["/pid", String(child.pid), "/f", "/t"], { windowsHide: true });
    } catch (_) {
      /* ignoré */
    }
  }
}

/* --------------------------------- Fenêtre ------------------------------- */

function isHttpUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch (_) {
    return false;
  }
}

function createWindow() {
  const appOrigin = `http://${HOST}:${PORT}`;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    title: "PahaePoster",
    icon: path.join(APP_ROOT, "assets", "icon.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Liens externes -> navigateur système ; jamais de nouvelle fenêtre Electron.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url) && new URL(url).origin !== appOrigin) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== appOrigin) {
      event.preventDefault();
      if (isHttpUrl(url)) shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (isMainFrame) log("[APP]", `Échec de chargement (${code}) ${description} : ${url}`);
  });

  mainWindow.once("ready-to-show", () => mainWindow && mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(appOrigin);
}

/* -------------------------------- Cycle de vie --------------------------- */

function fatal(error) {
  log("[APP]", `ERREUR FATALE : ${error && error.stack ? error.stack : error}`);
  dialog.showErrorBox(
    "Erreur PahaePoster",
    `${error && error.message ? error.message : String(error)}\n\nJournal : ${userDir("logs", "pahaeposter.log")}`
  );
  quitting = true;
  stopServer();
  app.exit(1);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    openLog();
    try {
      await startServer();
      createWindow();
    } catch (error) {
      fatal(error);
    }
  });

  app.on("activate", () => {
    if (serverReady && BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    quitting = true;
    stopServer();
  });

  process.on("exit", stopServer);
  process.on("SIGINT", () => app.quit());
  process.on("SIGTERM", () => app.quit());
}
