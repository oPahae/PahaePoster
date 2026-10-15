import { runQuery } from "../../../lib/sqlHelpers";
import { getDecryptedConnection } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    const { id, sql } = req.body || {};
    const config = getDecryptedConnection(id);
    if (!config) return res.status(404).json({ error: "Connexion introuvable" });
    const result = await runQuery(config, sql);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message, code: error.code || null });
  }
}
