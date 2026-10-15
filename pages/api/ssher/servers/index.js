import { getDb } from "../../../../lib/db";
import { encryptSecret } from "../../../../lib/crypto";

function serialize(row) {
  return { id: row.id, name: row.name, ip: row.ip, port: row.port, username: row.username, createdAt: row.createdat };
}

export default function handler(req, res) {
  const db = getDb();

  if (req.method === "GET") {
    const rows = db.prepare("SELECT * FROM servers ORDER BY id DESC").all();
    return res.status(200).json({ servers: rows.map(serialize) });
  }

  if (req.method === "POST") {
    const { name, ip, port, username, password } = req.body || {};
    if (!name || !ip || !username) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }
    const encryptedPassword = encryptSecret(password || "");
    const statement = db.prepare(
      "INSERT INTO servers (name, ip, port, username, password) VALUES (?, ?, ?, ?, ?)"
    );
    const result = statement.run(name, ip, port || 22, username, encryptedPassword);
    const row = db.prepare("SELECT * FROM servers WHERE id = ?").get(result.lastInsertRowid);
    return res.status(201).json({ server: serialize(row) });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
