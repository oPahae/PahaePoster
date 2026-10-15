import { resizeSession } from "../../../../lib/sshSessions";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }
  const { sessionId, cols, rows } = req.body || {};
  resizeSession(sessionId, cols, rows);
  return res.status(200).json({ success: true });
}
