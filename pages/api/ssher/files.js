import { createConnectionClient } from "../../../lib/sshSessions";
import { getDecryptedServer } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const { id, path = "/" } = req.body || {};
  const server = getDecryptedServer(id);
  if (!server) return res.status(404).json({ error: "Serveur introuvable" });

  let client;
  try {
    client = await createConnectionClient(server);
    const sftp = await new Promise((resolve, reject) => {
      client.sftp((error, handle) => (error ? reject(error) : resolve(handle)));
    });

    let targetPath = path;
    if (path === "~") {
      targetPath = await new Promise((resolve, reject) => {
        sftp.realpath(".", (error, resolvedPath) => (error ? reject(error) : resolve(resolvedPath)));
      });
    }

    const list = await new Promise((resolve, reject) => {
      sftp.readdir(targetPath, (error, entries) => (error ? reject(error) : resolve(entries)));
    });

    const items = list
      .map((entry) => ({
        name: entry.filename,
        isDirectory: entry.longname.startsWith("d"),
        size: entry.attrs.size,
        modifiedAt: entry.attrs.mtime * 1000
      }))
      .sort((a, b) => (a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1));

    client.end();
    return res.status(200).json({ path: targetPath, items });
  } catch (error) {
    if (client) client.end();
    return res.status(400).json({ error: error.message });
  }
}
