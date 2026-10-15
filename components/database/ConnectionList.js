import { Plus, Edit, Trash, Database as DatabaseIcon, FolderX } from "lucide-react";
import { classNames } from "../../lib/utils";

export default function ConnectionList({ connections, activeId, onConnect, onEdit, onDelete, onCreate }) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-base-800 bg-base-900">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-base-400">Connexions</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent transition-transform hover:scale-105 hover:bg-accent/20 active:scale-95"
        >
          <Plus size={13} /> Nouvelle
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {connections.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center text-xs text-base-500">
            <FolderX size={20} className="text-base-700" />
            Aucune connexion enregistree
          </div>
        )}
        {connections.map((connection) => {
          const active = connection.id === activeId;
          return (
            <div
              key={connection.id}
              className={classNames(
                "group relative cursor-pointer overflow-hidden rounded-lg border px-3 py-2.5 transition-colors",
                active ? "border-accent/40 bg-accent/5" : "border-transparent hover:bg-base-800/70"
              )}
              onClick={() => onConnect(connection)}
            >
              <span
                className={classNames(
                  "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex items-center gap-2">
                <span
                  className={classNames(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                    active ? "bg-accent/15 text-accent" : "text-base-500"
                  )}
                >
                  <DatabaseIcon size={12} />
                </span>
                <p className="truncate text-sm text-base-100">{connection.name}</p>
                {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse-glow rounded-full bg-accent" />}
              </div>
              <p className="mt-1 truncate text-[11px] text-base-500">
                {connection.type === "mysql" ? "MySQL" : "PostgreSQL"} - {connection.host}:{connection.port}
              </p>
              <div className="mt-2 hidden gap-2 group-hover:flex">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(connection);
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-base-400 hover:bg-base-700 hover:text-base-200"
                >
                  <Edit size={11} /> Modifier
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(connection);
                  }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-signal-rose hover:bg-signal-rose/10"
                >
                  <Trash size={11} /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
