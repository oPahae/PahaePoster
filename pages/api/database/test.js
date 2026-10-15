import { testConnection } from "../../../lib/sqlHelpers";
import { getDecryptedConnection } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    let config = req.body || {};
    if (config.id && !config.password) {
      const stored = getDecryptedConnection(config.id);
      if (!stored) return res.status(404).json({ error: "Connexion introuvable" });
      config = stored;
    }
    await testConnection(config);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
