import { getDb } from "../../../../lib/db";
import { encryptSecret } from "../../../../lib/crypto";
import { defaultPortFor } from "../../../../lib/utils";

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    host: row.host,
    port: row.port,
    user: row.user,
    database: row.database,
    createdAt: row.createdat
  };
}

export default function handler(req, res) {
  const db = getDb();

  if (req.method === "GET") {
    const rows = db.prepare("SELECT * FROM connections ORDER BY id DESC").all();
    return res.status(200).json({ connections: rows.map(serialize) });
  }

  if (req.method === "POST") {
    const { name, type, host, user, password, database, port } = req.body || {};
    if (!name || !type || !host || !user || !database) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }
    const resolvedPort = port || defaultPortFor(type);
    const encryptedPassword = encryptSecret(password || "");
    const statement = db.prepare(
      "INSERT INTO connections (name, type, host, port, user, password, database) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const result = statement.run(name, type, host, resolvedPort, user, encryptedPassword, database);
    const row = db.prepare("SELECT * FROM connections WHERE id = ?").get(result.lastInsertRowid);
    return res.status(201).json({ connection: serialize(row) });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
