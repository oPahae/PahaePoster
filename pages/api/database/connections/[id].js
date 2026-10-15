import { getDb } from "../../../../lib/db";
import { encryptSecret } from "../../../../lib/crypto";

export default function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === "PUT") {
    const { name, type, host, port, user, password, database } = req.body || {};
    const existing = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Connexion introuvable" });
    const encryptedPassword = password ? encryptSecret(password) : existing.password;
    db.prepare(
      "UPDATE connections SET name = ?, type = ?, host = ?, port = ?, user = ?, password = ?, database = ? WHERE id = ?"
    ).run(name || existing.name, type || existing.type, host || existing.host, port || existing.port, user || existing.user, encryptedPassword, database || existing.database, id);
    const updated = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);
    return res.status(200).json({
      connection: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        host: updated.host,
        port: updated.port,
        user: updated.user,
        database: updated.database
      }
    });
  }

  if (req.method === "DELETE") {
    db.prepare("DELETE FROM connections WHERE id = ?").run(id);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
