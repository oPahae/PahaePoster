import { writeToSession } from "../../../../lib/sshSessions";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }
  const { sessionId, data } = req.body || {};
  writeToSession(sessionId, data || "");
  return res.status(200).json({ success: true });
}
