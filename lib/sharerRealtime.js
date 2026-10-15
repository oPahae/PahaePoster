const rooms = global.__pahaeSharerRooms || new Map();
global.__pahaeSharerRooms = rooms;

export function broadcast(sessionCode, message) {
  const set = rooms.get(sessionCode);
  if (!set) return;
  const payload = JSON.stringify(message);
  set.forEach((socket) => {
    if (socket.readyState === 1) socket.send(payload);
  });
}

export function countClients(sessionCode) {
  const set = rooms.get(sessionCode);
  return set ? set.size : 0;
}
