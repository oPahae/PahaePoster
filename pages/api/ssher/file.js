import { createConnectionClient } from "../../../lib/sshSessions";
import { getDecryptedServer } from "../../../lib/connectionStore";

function openSftp(client) {
  return new Promise((resolve, reject) => {
    client.sftp((error, handle) => (error ? reject(error) : resolve(handle)));
  });
}

function readRemoteFile(sftp, path) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = sftp.createReadStream(path);
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

function writeRemoteFile(sftp, path, content) {
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(path);
    stream.on("close", resolve);
    stream.on("error", reject);
    stream.end(content);
  });
}

export default async function handler(req, res) {
  const body = req.method === "GET" ? req.query : req.body || {};
  const { id, path, content, isDirectory } = body;
  const server = getDecryptedServer(id);
  if (!server) return res.status(404).json({ error: "Serveur introuvable" });

  let client;
  try {
    client = await createConnectionClient(server);
    const sftp = await openSftp(client);

    if (req.method === "GET") {
      const fileContent = await readRemoteFile(sftp, path);
      client.end();
      return res.status(200).json({ path, content: fileContent });
    }

    if (req.method === "POST") {
      if (isDirectory) {
        await new Promise((resolve, reject) => {
          sftp.mkdir(path, (error) => (error ? reject(error) : resolve()));
        });
      } else {
        await writeRemoteFile(sftp, path, content || "");
      }
      client.end();
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      if (isDirectory) {
        await new Promise((resolve, reject) => {
          sftp.rmdir(path, (error) => (error ? reject(error) : resolve()));
        });
      } else {
        await new Promise((resolve, reject) => {
          sftp.unlink(path, (error) => (error ? reject(error) : resolve()));
        });
      }
      client.end();
      return res.status(200).json({ success: true });
    }

    client.end();
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  } catch (error) {
    if (client) client.end();
    return res.status(400).json({ error: error.message });
  }
}
