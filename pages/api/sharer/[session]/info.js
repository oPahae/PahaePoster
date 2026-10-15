import { sessionExists, readSessionMeta } from "../../../../lib/sharerStore";
import { listCandidateIPv4 } from "../../../../lib/localNetwork";
import { countClients } from "../../../../lib/sharerRealtime";

export default function handler(req, res) {
  const { session } = req.query;
  if (!sessionExists(session)) {
    return res.status(404).json({ error: "Session introuvable" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const meta = readSessionMeta(session);
  const host = req.headers.host || "";
  const port = host.includes(":") ? host.split(":")[1] : "80";
  const candidates = listCandidateIPv4();
  const ip = candidates.length ? candidates[0].address : "127.0.0.1";

  return res.status(200).json({
    code: meta.code,
    createdAt: meta.createdAt,
    ip,
    port,
    availableIps: candidates.map((candidate) => ({ name: candidate.name, address: candidate.address })),
    connectedDevices: countClients(session)
  });
}
