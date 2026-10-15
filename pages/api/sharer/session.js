import { getOrCreateCurrentSession, rotateSession } from "../../../lib/sharerStore";
import { getLocalIPv4 } from "../../../lib/localNetwork";
import { countClients, broadcast } from "../../../lib/sharerRealtime";

function extractPort(req) {
  const host = req.headers.host || "";
  return host.includes(":") ? host.split(":")[1] : "80";
}

function buildPayload(meta, req) {
  return {
    code: meta.code,
    createdAt: meta.createdAt,
    ip: getLocalIPv4(),
    port: extractPort(req),
    connectedDevices: countClients(meta.code)
  };
}

export default function handler(req, res) {
  if (req.method === "GET") {
    const meta = getOrCreateCurrentSession();
    return res.status(200).json(buildPayload(meta, req));
  }

  if (req.method === "POST") {
    const { previous, meta } = rotateSession();
    if (previous) broadcast(previous, { type: "session-destroyed" });
    return res.status(200).json(buildPayload(meta, req));
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Methode non autorisee" });
}
