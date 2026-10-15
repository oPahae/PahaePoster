import os from "os";

const VIRTUAL_NAME_PATTERN = /(virtualbox|vmware|hyper-v|vethernet|wsl|docker|loopback|tailscale|zerotier|npcap|tap|ppp|bluetooth|vpn)/i;

function scoreAddress(name, address) {
  if (VIRTUAL_NAME_PATTERN.test(name)) return 0;
  if (address.startsWith("192.168.")) return 3;
  if (address.startsWith("10.")) return 2;
  const parts = address.split(".").map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return 1;
  return 0.5;
}

export function listCandidateIPv4() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  Object.keys(interfaces).forEach((name) => {
    (interfaces[name] || []).forEach((entry) => {
      if (entry.family === "IPv4" && !entry.internal) {
        candidates.push({ name, address: entry.address, score: scoreAddress(name, entry.address) });
      }
    });
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export function getLocalIPv4() {
  const candidates = listCandidateIPv4();
  return candidates.length ? candidates[0].address : "127.0.0.1";
}
