import { openTerminalSession } from "../../../../lib/sshSessions";
import { getDecryptedServer } from "../../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    const { id, cols, rows } = req.body || {};
    const server = getDecryptedServer(id);
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });
    const sessionId = await openTerminalSession(server, { cols, rows });
    return res.status(200).json({ sessionId });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
