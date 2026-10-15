import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_ROOT = process.env.DATA_DIR || path.join(process.cwd(), "data");
const SESSIONS_ROOT = path.join(DATA_ROOT, "sessions");
const CURRENT_POINTER = path.join(DATA_ROOT, "sharer-current.json");
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

function isValidCode(code) {
  return typeof code === "string" && /^[A-Z0-9]{4,16}$/.test(code);
}

function sessionDir(code) {
  return path.join(SESSIONS_ROOT, code);
}

export function mediaDir(code) {
  return path.join(sessionDir(code), "media");
}

export function clipboardPath(code) {
  return path.join(sessionDir(code), "clipboard.json");
}

export function sessionExists(code) {
  if (!isValidCode(code)) return false;
  return fs.existsSync(path.join(sessionDir(code), "session.json"));
}

export function readSessionMeta(code) {
  if (!isValidCode(code)) return null;
  const metaPath = path.join(sessionDir(code), "session.json");
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (error) {
    return null;
  }
}

export function createSession() {
  ensureDir(SESSIONS_ROOT);
  let code = generateCode();
  while (fs.existsSync(sessionDir(code))) {
    code = generateCode();
  }
  const dir = sessionDir(code);
  ensureDir(path.join(dir, "media"));
  const meta = { code, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, "session.json"), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(dir, "clipboard.json"), JSON.stringify([], null, 2));
  ensureDir(DATA_ROOT);
  fs.writeFileSync(CURRENT_POINTER, JSON.stringify({ code }, null, 2));
  return meta;
}

export function destroySession(code) {
  if (!isValidCode(code)) return;
  const dir = sessionDir(code);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function readPointerCode() {
  if (!fs.existsSync(CURRENT_POINTER)) return null;
  try {
    const pointer = JSON.parse(fs.readFileSync(CURRENT_POINTER, "utf8"));
    return pointer.code || null;
  } catch (error) {
    return null;
  }
}

export function getOrCreateCurrentSession() {
  ensureDir(DATA_ROOT);
  const pointerCode = readPointerCode();
  if (pointerCode && sessionExists(pointerCode)) {
    return readSessionMeta(pointerCode);
  }
  return createSession();
}

export function rotateSession() {
  const previous = readPointerCode();
  if (previous) {
    destroySession(previous);
  }
  const meta = createSession();
  return { previous, meta };
}

export function readClipboard(code) {
  if (!isValidCode(code)) return [];
  const filePath = clipboardPath(code);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return [];
  }
}

export function writeClipboard(code, entries) {
  if (!isValidCode(code)) return;
  ensureDir(sessionDir(code));
  fs.writeFileSync(clipboardPath(code), JSON.stringify(entries, null, 2));
}

function guessFileType(name) {
  const extension = (name.split(".").pop() || "").toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(extension)) return "image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(extension)) return "video";
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(extension)) return "audio";
  if (["pdf", "doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx", "csv"].includes(extension)) return "document";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "archive";
  return "other";
}

export function listFiles(code) {
  if (!isValidCode(code)) return [];
  const dir = mediaDir(code);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((filename) => fs.statSync(path.join(dir, filename)).isFile())
    .map((filename) => {
      const stats = fs.statSync(path.join(dir, filename));
      return {
        name: filename,
        size: stats.size,
        modifiedAt: stats.mtimeMs,
        type: guessFileType(filename)
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}

export function sanitizeFilename(name) {
  const base = path.basename(String(name || "file"));
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_");
  return cleaned.slice(-150) || "file";
}

export function avoidCollision(dir, filename) {
  let candidate = filename;
  let counter = 1;
  const extension = path.extname(filename);
  const stem = filename.slice(0, filename.length - extension.length);
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${stem}(${counter})${extension}`;
    counter += 1;
  }
  return candidate;
}

export function resolveMediaFilePath(code, filename) {
  if (!isValidCode(code)) return null;
  const dir = mediaDir(code);
  const safeName = sanitizeFilename(filename);
  const target = path.join(dir, safeName);
  const relative = path.relative(dir, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return target;
}
