import { createConnectionClient } from "../../../lib/sshSessions";
import { getDecryptedServer } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const { id, oldPath, newPath } = req.body || {};
  const server = getDecryptedServer(id);
  if (!server) return res.status(404).json({ error: "Serveur introuvable" });

  let client;
  try {
    client = await createConnectionClient(server);
    const sftp = await new Promise((resolve, reject) => {
      client.sftp((error, handle) => (error ? reject(error) : resolve(handle)));
    });
    await new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (error) => (error ? reject(error) : resolve()));
    });
    client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    if (client) client.end();
    return res.status(400).json({ error: error.message });
  }
}
