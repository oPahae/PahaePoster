import { Client } from "ssh2";
import crypto from "crypto";

const sessions = global.__pahaeSshSessions || new Map();
global.__pahaeSshSessions = sessions;

export function createConnectionClient(server) {
  return new Promise((resolve, reject) => {
    const client = new Client();
    client
      .on("ready", () => resolve(client))
      .on("error", (error) => reject(error))
      .connect({
        host: server.ip,
        port: Number(server.port) || 22,
        username: server.username,
        password: server.password,
        readyTimeout: 8000
      });
  });
}

export async function openTerminalSession(server, dims = {}) {
  const client = await createConnectionClient(server);
  const sessionId = crypto.randomUUID();
  const buffer = [];
  const listeners = new Set();

  const emit = (chunk) => {
    buffer.push(chunk);
    if (buffer.length > 500) buffer.shift();
    listeners.forEach((listener) => listener(chunk));
  };

  const session = { client, stream: null, buffer, listeners, emit, closed: false };
  sessions.set(sessionId, session);

  const cols = Number(dims.cols) || 80;
  const rows = Number(dims.rows) || 24;

  client.shell({ term: "xterm-256color", cols, rows }, (error, stream) => {
    if (error) {
      emit(`\r\n[erreur] ${error.message}\r\n`);
      return;
    }
    session.stream = stream;
    stream.on("data", (data) => emit(data.toString("utf8")));
    stream.stderr.on("data", (data) => emit(data.toString("utf8")));
    stream.on("close", () => {
      session.closed = true;
      client.end();
    });
  });

  return sessionId;
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function writeToSession(sessionId, data) {
  const session = sessions.get(sessionId);
  if (session && session.stream) {
    session.stream.write(data);
  }
}

export function resizeSession(sessionId, cols, rows) {
  const session = sessions.get(sessionId);
  if (session && session.stream) {
    session.stream.setWindow(rows, cols, 0, 0);
  }
}

export function closeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    if (session.stream) session.stream.end();
    session.client.end();
    sessions.delete(sessionId);
  }
}
