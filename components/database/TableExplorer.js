import { useEffect, useState } from "react";
import { Table2, ChevronRight, KeyRound } from "lucide-react";
import axios from "axios";
import { classNames } from "../../lib/utils";

export default function TableExplorer({ connectionId, activeTable, onSelectTable }) {
  const [tables, setTables] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    axios
      .post("/api/database/tables", { id: connectionId })
      .then(({ data }) => setTables(data.tables || []))
      .finally(() => setLoading(false));
  }, [connectionId]);

  async function toggleExpand(table) {
    if (expanded === table) {
      setExpanded(null);
      return;
    }
    setExpanded(table);
    if (!columns[table]) {
      const { data } = await axios.post("/api/database/schema", { id: connectionId, table });
      setColumns((current) => ({ ...current, [table]: data.columns }));
    }
  }

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-base-800 bg-base-900">
      <div className="px-4 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-base-400">Tables</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading && <p className="px-3 py-3 text-xs text-base-500">Chargement...</p>}
        {!loading && tables.length === 0 && <p className="px-3 py-3 text-xs text-base-500">Aucune table</p>}
        {tables.map((table) => (
          <div key={table}>
            <div
              className={classNames(
                "group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                activeTable === table ? "bg-accent/10 text-accent" : "text-base-300 hover:bg-base-800/70"
              )}
            >
              <button
                onClick={() => toggleExpand(table)}
                className="text-base-500 transition-transform duration-150 hover:text-base-300"
                style={{ transform: expanded === table ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                <ChevronRight size={13} />
              </button>
              <Table2 size={13} className="shrink-0" />
              <span onClick={() => onSelectTable(table)} className="truncate">
                {table}
              </span>
            </div>
            {expanded === table && (
              <div className="ml-8 mb-1 animate-slide-down space-y-0.5 border-l border-base-800 pl-3">
                {(columns[table] || []).map((column) => (
                  <div key={column.column} className="flex items-center gap-1.5 py-0.5 text-[11px] text-base-500">
                    {column.key === "PRI" && <KeyRound size={10} className="text-signal-amber" />}
                    <span className="text-base-300">{column.column}</span>
                    <span className="text-base-600">{column.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
