import fs from "fs";
import formidable from "formidable";
import {
  sessionExists,
  mediaDir,
  listFiles,
  sanitizeFilename,
  avoidCollision
} from "../../../../../lib/sharerStore";
import { broadcast } from "../../../../../lib/sharerRealtime";

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  const { session } = req.query;
  if (!sessionExists(session)) {
    return res.status(404).json({ error: "Session introuvable" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ files: listFiles(session) });
  }

  if (req.method === "POST") {
    const dir = mediaDir(session);
    fs.mkdirSync(dir, { recursive: true });
    const form = formidable({ multiples: true, uploadDir: dir, keepExtensions: true, maxFileSize: 2 * 1024 * 1024 * 1024 });

    form.parse(req, (error, fields, files) => {
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const uploaded = Object.values(files).flat().filter(Boolean);
      const savedNames = [];

      uploaded.forEach((file) => {
        const originalName = file.originalFilename || "fichier";
        const safeName = avoidCollision(dir, sanitizeFilename(originalName));
        const targetPath = `${dir}/${safeName}`;
        try {
          fs.renameSync(file.filepath, targetPath);
          savedNames.push(safeName);
        } catch (renameError) {
          savedNames.push(null);
        }
      });

      const nextFiles = listFiles(session);
      savedNames
        .filter(Boolean)
        .forEach((name) => {
          const entry = nextFiles.find((item) => item.name === name);
          if (entry) broadcast(session, { type: "file-added", file: entry });
        });

      return res.status(201).json({ files: nextFiles });
    });
    return undefined;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
