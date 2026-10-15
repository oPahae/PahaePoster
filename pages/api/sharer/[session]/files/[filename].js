import fs from "fs";
import { sessionExists, resolveMediaFilePath } from "../../../../../lib/sharerStore";
import { broadcast } from "../../../../../lib/sharerRealtime";

export default function handler(req, res) {
  const { session, filename } = req.query;
  if (!sessionExists(session)) {
    return res.status(404).json({ error: "Session introuvable" });
  }

  const filePath = resolveMediaFilePath(session, filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  if (req.method === "GET") {
    const stats = fs.statSync(filePath);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return undefined;
  }

  if (req.method === "DELETE") {
    fs.unlinkSync(filePath);
    broadcast(session, { type: "file-removed", filename });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
