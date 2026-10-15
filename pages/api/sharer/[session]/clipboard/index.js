import crypto from "crypto";
import { sessionExists, readClipboard, writeClipboard } from "../../../../../lib/sharerStore";
import { broadcast } from "../../../../../lib/sharerRealtime";

export default function handler(req, res) {
  const { session } = req.query;
  if (!sessionExists(session)) {
    return res.status(404).json({ error: "Session introuvable" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ items: readClipboard(session) });
  }

  if (req.method === "POST") {
    const { text, device } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texte requis" });
    }
    const entry = {
      id: crypto.randomUUID(),
      text: text.trim(),
      device: device || "Appareil",
      createdAt: new Date().toISOString()
    };
    const items = [entry, ...readClipboard(session)];
    writeClipboard(session, items);
    broadcast(session, { type: "clipboard-added", entry });
    return res.status(201).json({ entry });
  }

  if (req.method === "DELETE") {
    writeClipboard(session, []);
    broadcast(session, { type: "clipboard-cleared" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
