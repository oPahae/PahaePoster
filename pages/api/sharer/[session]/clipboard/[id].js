import { sessionExists, readClipboard, writeClipboard } from "../../../../../lib/sharerStore";
import { broadcast } from "../../../../../lib/sharerRealtime";

export default function handler(req, res) {
  const { session, id } = req.query;
  if (!sessionExists(session)) {
    return res.status(404).json({ error: "Session introuvable" });
  }
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }
  const items = readClipboard(session).filter((item) => item.id !== id);
  writeClipboard(session, items);
  broadcast(session, { type: "clipboard-removed", id });
  return res.status(200).json({ success: true });
}
