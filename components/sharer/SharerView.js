import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import QRCode from "qrcode";
import { Wifi, Users, Clock, Copy, RefreshCw, QrCode as QrCodeIcon, ChevronDown } from "lucide-react";
import useSharerSocket from "./useSharerSocket";
import MediaTab from "./MediaTab";
import ClipboardTab from "./ClipboardTab";
import { useNotification } from "../layout/NotificationContext";
import { classNames } from "../../lib/utils";
import Loader from "../layout/Loader";

const IP_OVERRIDE_KEY = "pahaeposter-sharer-ip";

export default function SharerView({ code }) {
  const router = useRouter();
  const { notify, confirm } = useNotification();
  const [info, setInfo] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null);
  const [ipMenuOpen, setIpMenuOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [tab, setTab] = useState("media");
  const [lastActivity, setLastActivity] = useState(null);
  const [rotating, setRotating] = useState(false);
  const filesReloadRef = useRef(null);
  const clipboardReloadRef = useRef(null);

  const loadInfo = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/sharer/${code}/info`);
      setInfo(data);
      const stored = window.localStorage.getItem(IP_OVERRIDE_KEY);
      const validStoredIp = stored && data.availableIps.some((candidate) => candidate.address === stored);
      setSelectedIp(validStoredIp ? stored : data.ip);
    } catch (error) {
      notify("Session introuvable", "error");
    }
  }, [code, notify]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  useEffect(() => {
    if (!info || !selectedIp) return;
    const shareUrl = `http://${selectedIp}:${info.port}/sharer/${code}`;
    QRCode.toDataURL(shareUrl, { margin: 1, width: 240 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [info, selectedIp, code]);

  const handleSocketMessage = useCallback(
    (message) => {
      setLastActivity(new Date());
      if (message.type === "presence") {
        setInfo((current) => (current ? { ...current, connectedDevices: message.count } : current));
      }
      if (message.type === "file-added" || message.type === "file-removed") {
        if (filesReloadRef.current) filesReloadRef.current();
      }
      if (message.type === "clipboard-added" || message.type === "clipboard-removed" || message.type === "clipboard-cleared") {
        if (clipboardReloadRef.current) clipboardReloadRef.current();
      }
      if (message.type === "session-destroyed") {
        notify("Cette session a ete remplacee", "error");
        router.push("/sharer");
      }
    },
    [notify, router]
  );

  useSharerSocket(code, handleSocketMessage);

  async function handleNewSession() {
    const confirmed = await confirm({
      title: "Creer une nouvelle session",
      description: "L'ancienne session et tous ses fichiers seront definitivement supprimes.",
      confirmLabel: "Creer",
      danger: true
    });
    if (!confirmed) return;
    setRotating(true);
    try {
      const { data } = await axios.post("/api/sharer/session");
      router.push(`/sharer/${data.code}`);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setRotating(false);
    }
  }

  function selectIp(address) {
    setSelectedIp(address);
    window.localStorage.setItem(IP_OVERRIDE_KEY, address);
    setIpMenuOpen(false);
  }

  function copyAddress() {
    if (!info || !selectedIp) return;
    navigator.clipboard.writeText(`http://${selectedIp}:${info.port}/sharer/${code}`);
    notify("Adresse copiee", "success");
  }

  if (!info || !selectedIp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-950">
        <Loader label="Chargement de la session..." />
      </div>
    );
  }

  const shareUrl = `http://${selectedIp}:${info.port}/sharer/${code}`;

  return (
    <div className="min-h-screen bg-base-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-xl border border-base-800 bg-base-900 p-4 shadow-panel sm:flex-row sm:gap-6 sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Sharer</p>
            <h1 className="mt-2 text-xl font-semibold text-base-100">Session {code}</h1>
            <button
              onClick={copyAddress}
              className="mt-3 flex w-full items-center gap-2 break-all rounded-md border border-base-700 px-3 py-2 text-left font-mono text-xs text-base-200 hover:border-accent hover:text-accent sm:w-auto"
            >
              {shareUrl}
              <Copy size={13} className="shrink-0" />
            </button>

            {info.availableIps.length > 1 && (
              <div className="relative mt-2 inline-block">
                <button
                  onClick={() => setIpMenuOpen((current) => !current)}
                  className="flex items-center gap-1 text-[11px] text-base-500 hover:text-accent"
                >
                  Changer d'adresse detectee <ChevronDown size={11} />
                </button>
                {ipMenuOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-64 max-w-[85vw] overflow-hidden rounded-md border border-base-700 bg-base-850 shadow-panel">
                    {info.availableIps.map((candidate) => (
                      <button
                        key={candidate.address}
                        onClick={() => selectIp(candidate.address)}
                        className={classNames(
                          "flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-xs hover:bg-base-800",
                          candidate.address === selectedIp ? "text-accent" : "text-base-300"
                        )}
                      >
                        <span>{candidate.address}</span>
                        <span className="text-base-600">{candidate.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-base-400 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <Wifi size={13} className="text-accent" /> Connecte
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} /> {info.connectedDevices} appareil(s)
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {lastActivity ? lastActivity.toLocaleTimeString() : "aucune activite"}
              </span>
            </div>
            <button
              onClick={handleNewSession}
              disabled={rotating}
              className="mt-5 flex items-center gap-1.5 rounded-md border border-signal-rose/40 px-3 py-1.5 text-xs text-signal-rose hover:bg-signal-rose/10"
            >
              <RefreshCw size={13} /> Nouvelle session
            </button>
          </div>
          <div className="flex shrink-0 items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="h-32 w-32 rounded-md border border-base-700 bg-white p-2 sm:h-36 sm:w-36" />
            ) : (
              <QrCodeIcon size={80} className="text-base-600" />
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-1 border-b border-base-800">
          <TabButton active={tab === "media"} onClick={() => setTab("media")} label="Medias" />
          <TabButton active={tab === "clipboard"} onClick={() => setTab("clipboard")} label="Presse-papiers" />
        </div>

        <div className="mt-4 pb-8">
          {tab === "media" && <MediaTab code={code} registerReload={(fn) => (filesReloadRef.current = fn)} />}
          {tab === "clipboard" && <ClipboardTab code={code} registerReload={(fn) => (clipboardReloadRef.current = fn)} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "rounded-t-md px-4 py-2 text-sm font-medium",
        active ? "border-b-2 border-accent text-accent" : "text-base-400 hover:text-base-200"
      )}
    >
      {label}
    </button>
  );
}
