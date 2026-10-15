import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { TerminalSquare, FolderTree, ServerOff } from "lucide-react";
import ServerList from "./ServerList";
import ServerModal from "./ServerModal";
import Terminal from "./Terminal";
import FileExplorer from "./FileExplorer";
import { useNotification } from "../layout/NotificationContext";
import { classNames } from "../../lib/utils";

export default function SsherModule() {
  const { notify, confirm } = useNotification();
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [modalServer, setModalServer] = useState(undefined);
  const [view, setView] = useState("terminal");

  const loadServers = useCallback(async () => {
    const { data } = await axios.get("/api/ssher/servers");
    setServers(data.servers);
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  async function handleDelete(server) {
    const confirmed = await confirm({
      title: "Supprimer ce serveur",
      description: `Le serveur "${server.name}" sera definitivement supprime.`,
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    await axios.delete(`/api/ssher/servers/${server.id}`);
    if (activeServer?.id === server.id) setActiveServer(null);
    notify("Serveur supprime", "success");
    loadServers();
  }

  return (
    <div className="flex h-full">
      <ServerList
        servers={servers}
        activeId={activeServer?.id}
        onSelect={setActiveServer}
        onEdit={(server) => setModalServer(server)}
        onDelete={handleDelete}
        onCreate={() => setModalServer(null)}
      />

      {activeServer ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-base-800 bg-base-900/60 px-4 py-2">
            <TabButton active={view === "terminal"} onClick={() => setView("terminal")} icon={TerminalSquare} label="Terminal" />
            <TabButton active={view === "files"} onClick={() => setView("files")} icon={FolderTree} label="Fichiers" />
          </div>
          <div className="flex-1 overflow-hidden">
            {view === "terminal" && <Terminal key={activeServer.id} serverId={activeServer.id} />}
            {view === "files" && <FileExplorer key={activeServer.id} serverId={activeServer.id} />}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 animate-fade-in flex-col items-center justify-center gap-2 text-sm text-base-500">
          <ServerOff size={24} className="text-base-700" />
          Selectionne ou cree un serveur pour commencer
        </div>
      )}

      {modalServer !== undefined && (
        <ServerModal
          server={modalServer}
          onClose={() => setModalServer(undefined)}
          onSaved={() => {
            setModalServer(undefined);
            loadServers();
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
        active ? "text-accent" : "text-base-400 hover:bg-base-800 hover:text-base-200"
      )}
    >
      {active && <span className="absolute inset-0 rounded-md bg-accent/10" />}
      <Icon size={13} className="relative" />
      <span className="relative">{label}</span>
    </button>
  );
}
