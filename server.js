const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.argv.includes("--dev");
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms = global.__pahaeSharerRooms || new Map();
global.__pahaeSharerRooms = rooms;

function broadcastPresence(sessionCode) {
  const set = rooms.get(sessionCode);
  if (!set) return;
  const payload = JSON.stringify({ type: "presence", count: set.size });
  set.forEach((socket) => {
    if (socket.readyState === 1) socket.send(payload);
  });
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, query } = parse(req.url, true);

    if (pathname === "/api/sharer/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        const sessionCode = query.session;
        if (!sessionCode) {
          ws.close();
          return;
        }
        if (!rooms.has(sessionCode)) rooms.set(sessionCode, new Set());
        rooms.get(sessionCode).add(ws);
        broadcastPresence(sessionCode);

        ws.on("close", () => {
          const set = rooms.get(sessionCode);
          if (set) {
            set.delete(ws);
            if (set.size === 0) {
              rooms.delete(sessionCode);
            } else {
              broadcastPresence(sessionCode);
            }
          }
        });
      });
      return;
    }

    const upgradeHandler = app.getUpgradeHandler ? app.getUpgradeHandler() : null;
    if (upgradeHandler) {
      upgradeHandler(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  const port = process.env.PORT || 5555;
  server.listen(port, () => {
    process.stdout.write(`PahaePoster ready on http://localhost:${port}\n`);
  });
});
