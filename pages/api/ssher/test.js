import { createConnectionClient } from "../../../lib/sshSessions";
import { getDecryptedServer } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    let config = req.body || {};
    if (config.id && !config.password) {
      const stored = getDecryptedServer(config.id);
      if (!stored) return res.status(404).json({ error: "Serveur introuvable" });
      config = stored;
    }
    const client = await createConnectionClient(config);
    client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
