import { useEffect, useRef } from "react";

export default function useSharerSocket(code, onMessage) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!code) return undefined;
    let closedByCleanup = false;
    let reconnectTimer = null;
    let socket = null;

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/api/sharer/ws?session=${code}`);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handlerRef.current(data);
        } catch (error) {
          return;
        }
      };

      socket.onclose = () => {
        if (!closedByCleanup) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      closedByCleanup = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [code]);
}
