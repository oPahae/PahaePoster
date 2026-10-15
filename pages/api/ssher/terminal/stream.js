import { getSession } from "../../../../lib/sshSessions";

export const config = {
  api: {
    responseLimit: false
  }
};

export default function handler(req, res) {
  const { sessionId } = req.query;
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session introuvable" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  if (res.socket && typeof res.socket.setNoDelay === "function") {
    res.socket.setNoDelay(true);
  }
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  session.buffer.forEach((chunk) => {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  });

  const listener = (chunk) => {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  };
  session.listeners.add(listener);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    session.listeners.delete(listener);
  });
}
