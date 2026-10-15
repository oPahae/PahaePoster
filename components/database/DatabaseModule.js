import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Workflow, Table2, Code2, DatabaseZap } from "lucide-react";
import ConnectionList from "./ConnectionList";
import ConnectionModal from "./ConnectionModal";
import TableExplorer from "./TableExplorer";
import DataTable from "./DataTable";
import SqlEditor from "./SqlEditor";
import ErdViewer from "./ErdViewer";
import { useNotification } from "../layout/NotificationContext";
import { classNames } from "../../lib/utils";

export default function DatabaseModule() {
  const { notify, confirm } = useNotification();
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [modalConnection, setModalConnection] = useState(undefined);
  const [showErd, setShowErd] = useState(false);
  const [view, setView] = useState("data");

  const loadConnections = useCallback(async () => {
    const { data } = await axios.get("/api/database/connections");
    setConnections(data.connections);
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  async function handleConnect(connection) {
    try {
      const { data } = await axios.post("/api/database/test", { id: connection.id });
      if (data.success) {
        setActiveConnection(connection);
        setActiveTable(null);
        notify(`Connecte a ${connection.name}`, "success");
      } else {
        notify(data.error || "Connexion impossible", "error");
      }
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  async function handleDelete(connection) {
    const confirmed = await confirm({
      title: "Supprimer cette connexion",
      description: `La connexion "${connection.name}" sera definitivement supprimee.`,
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    await axios.delete(`/api/database/connections/${connection.id}`);
    if (activeConnection?.id === connection.id) setActiveConnection(null);
    notify("Connexion supprimee", "success");
    loadConnections();
  }

  return (
    <div className="flex h-full">
      <ConnectionList
        connections={connections}
        activeId={activeConnection?.id}
        onConnect={handleConnect}
        onEdit={(connection) => setModalConnection(connection)}
        onDelete={handleDelete}
        onCreate={() => setModalConnection(null)}
      />

      {activeConnection ? (
        <>
          <TableExplorer
            connectionId={activeConnection.id}
            activeTable={activeTable}
            onSelectTable={(table) => {
              setActiveTable(table);
              setView("data");
            }}
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-1 border-b border-base-800 bg-base-900/60 px-4 py-2">
              <TabButton active={view === "data"} onClick={() => setView("data")} icon={Table2} label="Donnees" />
              <TabButton active={view === "sql"} onClick={() => setView("sql")} icon={Code2} label="SQL" />
              <button
                onClick={() => setShowErd(true)}
                className="ml-auto flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
              >
                <Workflow size={13} /> Voir MPD
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {view === "data" && activeTable && <DataTable connectionId={activeConnection.id} table={activeTable} />}
              {view === "data" && !activeTable && (
                <div className="flex h-full animate-fade-in flex-col items-center justify-center gap-2 text-sm text-base-500">
                  <Table2 size={22} className="text-base-700" />
                  Selectionne une table pour explorer les donnees
                </div>
              )}
              {view === "sql" && <SqlEditor connectionId={activeConnection.id} activeTable={activeTable} />}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 animate-fade-in flex-col items-center justify-center gap-2 text-sm text-base-500">
          <DatabaseZap size={24} className="text-base-700" />
          Selectionne ou cree une connexion pour commencer
        </div>
      )}

      {modalConnection !== undefined && (
        <ConnectionModal
          connection={modalConnection}
          onClose={() => setModalConnection(undefined)}
          onSaved={() => {
            setModalConnection(undefined);
            loadConnections();
          }}
        />
      )}

      {showErd && activeConnection && <ErdViewer connectionId={activeConnection.id} onClose={() => setShowErd(false)} />}
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
