import { getDb } from "./db";
import { decryptSecret } from "./crypto";

export function getDecryptedConnection(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    host: row.host,
    port: row.port,
    user: row.user,
    password: decryptSecret(row.password),
    database: row.database
  };
}

export function getDecryptedServer(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    ip: row.ip,
    port: row.port,
    username: row.username,
    password: decryptSecret(row.password)
  };
}
