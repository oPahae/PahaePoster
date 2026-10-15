import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNotification } from "../layout/NotificationContext";
import { useTheme } from "../layout/ThemeContext";
import Loader from "../layout/Loader";

function waitForFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const TERMINAL_THEMES = {
  dark: { background: "#000000", foreground: "#f4f4f5", cursor: "#38bdf8" },
  light: { background: "#ffffff", foreground: "#18181b", cursor: "#0284c7" }
};

export default function Terminal({ serverId }) {
  const { notify } = useNotification();
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const sessionIdRef = useRef(null);
  const eventSourceRef = useRef(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = TERMINAL_THEMES[theme] || TERMINAL_THEMES.dark;
    }
  }, [theme]);

  useEffect(() => {
    let disposed = false;
    let localTerm = null;
    let localFit = null;
    let localEventSource = null;
    let localSessionId = null;
    let resizeObserver = null;

    async function boot() {
      const { Terminal: XTerm } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      if (disposed) return;

      while (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      const term = new XTerm({
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        scrollback: 5000,
        theme: TERMINAL_THEMES[theme] || TERMINAL_THEMES.dark
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      localTerm = term;
      localFit = fitAddon;
      termRef.current = term;
      fitRef.current = fitAddon;

      await waitForFrame();
      await waitForFrame();
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (fontError) {
          setConnecting((current) => current);
        }
      }
      if (disposed) return;
      fitAddon.fit();

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (disposed) return;
          if (containerRef.current && containerRef.current.offsetWidth > 0) {
            fitAddon.fit();
            if (sessionIdRef.current && termRef.current === term) {
              axios.post("/api/ssher/terminal/resize", {
                sessionId: sessionIdRef.current,
                cols: term.cols,
                rows: term.rows
              });
            }
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      try {
        const { data } = await axios.post("/api/ssher/terminal/start", {
          id: serverId,
          cols: term.cols,
          rows: term.rows
        });
        if (disposed) {
          axios.post("/api/ssher/terminal/close", { sessionId: data.sessionId });
          return;
        }
        localSessionId = data.sessionId;
        sessionIdRef.current = data.sessionId;
        setConnecting(false);

        const eventSource = new EventSource(`/api/ssher/terminal/stream?sessionId=${data.sessionId}`);
        localEventSource = eventSource;
        eventSourceRef.current = eventSource;
        eventSource.onmessage = (event) => {
          const chunk = JSON.parse(event.data);
          term.write(chunk);
        };

        term.onData((input) => {
          axios.post("/api/ssher/terminal/input", { sessionId: localSessionId, data: input });
        });
      } catch (error) {
        setConnecting(false);
        notify(error?.response?.data?.error || error.message, "error");
      }
    }

    boot();

    function handleWindowResize() {
      if (disposed) return;
      if (fitRef.current && containerRef.current && containerRef.current.offsetWidth > 0) {
        fitRef.current.fit();
        if (sessionIdRef.current && termRef.current) {
          axios.post("/api/ssher/terminal/resize", {
            sessionId: sessionIdRef.current,
            cols: termRef.current.cols,
            rows: termRef.current.rows
          });
        }
      }
    }
    window.addEventListener("resize", handleWindowResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleWindowResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (localEventSource) localEventSource.close();
      if (localSessionId) axios.post("/api/ssher/terminal/close", { sessionId: localSessionId });
      if (localTerm) localTerm.dispose();
      if (termRef.current === localTerm) {
        termRef.current = null;
        fitRef.current = null;
      }
      if (sessionIdRef.current === localSessionId) {
        sessionIdRef.current = null;
      }
      if (eventSourceRef.current === localEventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [serverId, notify]);

  return (
    <div className="relative h-full w-full bg-base-950 p-3">
      {connecting && (
        <div className="absolute inset-0 z-10 flex animate-fade-in items-center justify-center bg-base-950/85 backdrop-blur-sm">
          <Loader label="Connexion au serveur..." />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full rounded-md shadow-[inset_0_0_0_1px_rgb(var(--base-800))]" />
    </div>
  );
}
