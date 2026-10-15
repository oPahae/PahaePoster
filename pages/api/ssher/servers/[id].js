import { getDb } from "../../../../lib/db";
import { encryptSecret } from "../../../../lib/crypto";

export default function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === "PUT") {
    const { name, ip, port, username, password } = req.body || {};
    const existing = db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Serveur introuvable" });
    const encryptedPassword = password ? encryptSecret(password) : existing.password;
    db.prepare("UPDATE servers SET name = ?, ip = ?, port = ?, username = ?, password = ? WHERE id = ?").run(
      name || existing.name,
      ip || existing.ip,
      port || existing.port,
      username || existing.username,
      encryptedPassword,
      id
    );
    const updated = db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
    return res.status(200).json({
      server: { id: updated.id, name: updated.name, ip: updated.ip, port: updated.port, username: updated.username }
    });
  }

  if (req.method === "DELETE") {
    db.prepare("DELETE FROM servers WHERE id = ?").run(id);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
