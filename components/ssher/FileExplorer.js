import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Folder, File as FileIcon, Trash, Plus, FolderPlus, ChevronRight, House, UserRound, Edit } from "lucide-react";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";
import NanoEditor from "./NanoEditor";

export default function FileExplorer({ serverId }) {
  const { notify, confirm } = useNotification();
  const [path, setPath] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPath, setEditingPath] = useState(null);
  const [creating, setCreating] = useState(null);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(
    async (targetPath) => {
      setLoading(true);
      try {
        const { data } = await axios.post("/api/ssher/files", { id: serverId, path: targetPath });
        setItems(data.items);
        setPath(data.path);
      } catch (error) {
        notify(error?.response?.data?.error || error.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [serverId, notify]
  );

  useEffect(() => {
    load("/");
  }, [load]);

  function joinPath(base, name) {
    if (base === "/") return `/${name}`;
    return base.endsWith("/") ? `${base}${name}` : `${base}/${name}`;
  }

  function parentPath() {
    if (path === "/" ) return "/";
    const segments = path.split("/").filter(Boolean);
    segments.pop();
    return segments.length ? `/${segments.join("/")}` : "/";
  }

  async function handleDelete(item) {
    const confirmed = await confirm({
      title: `Supprimer ${item.name}`,
      description: "Cette action est irreversible.",
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axios.delete("/api/ssher/file", {
        data: { id: serverId, path: joinPath(path, item.name), isDirectory: item.isDirectory }
      });
      notify("Supprime", "success");
      load(path);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await axios.post("/api/ssher/file", {
        id: serverId,
        path: joinPath(path, newName),
        content: "",
        isDirectory: creating === "folder"
      });
      notify("Cree avec succes", "success");
      setCreating(null);
      setNewName("");
      load(path);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  function startRename(item) {
    setRenaming(item.name);
    setRenameValue(item.name);
  }

  async function handleRename(item) {
    if (!renameValue.trim() || renameValue === item.name) {
      setRenaming(null);
      return;
    }
    try {
      await axios.post("/api/ssher/rename", {
        id: serverId,
        oldPath: joinPath(path, item.name),
        newPath: joinPath(path, renameValue.trim())
      });
      notify("Renomme avec succes", "success");
      setRenaming(null);
      load(path);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-base-800 bg-base-900/60 px-4 py-2.5">
        <button onClick={() => load("/")} title="Racine du systeme" className="text-base-500 hover:text-accent">
          <House size={14} />
        </button>
        <button onClick={() => load("~")} title="Dossier utilisateur" className="text-base-500 hover:text-accent">
          <UserRound size={14} />
        </button>
        <ChevronRight size={12} className="text-base-600" />
        <span className="truncate font-mono text-xs text-base-300">{path}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setCreating("file")}
            className="flex items-center gap-1 rounded-md border border-base-700 px-2 py-1 text-[11px] text-base-400 hover:border-accent hover:text-accent"
          >
            <Plus size={11} /> Fichier
          </button>
          <button
            onClick={() => setCreating("folder")}
            className="flex items-center gap-1 rounded-md border border-base-700 px-2 py-1 text-[11px] text-base-400 hover:border-accent hover:text-accent"
          >
            <FolderPlus size={11} /> Dossier
          </button>
        </div>
      </div>

      {creating && (
        <div className="flex items-center gap-2 border-b border-base-800 px-4 py-2">
          <input
            autoFocus
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleCreate()}
            placeholder={creating === "folder" ? "nom-du-dossier" : "nom-du-fichier.txt"}
            className="flex-1 rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
          />
          <button onClick={handleCreate} className="rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
            Creer
          </button>
          <button
            onClick={() => {
              setCreating(null);
              setNewName("");
            }}
            className="rounded-md px-3 py-1.5 text-xs text-base-400 hover:bg-base-800"
          >
            Annuler
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader label="Chargement..." />
          </div>
        ) : (
          <>
            {path !== "/" && (
              <div
                onClick={() => load(parentPath())}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-base-400 transition-colors hover:bg-base-800/70"
              >
                <Folder size={14} /> ..
              </div>
            )}
            {items.map((item) => (
              <div key={item.name} className="group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-base-800/70">
                {item.isDirectory ? (
                  <Folder size={14} className="text-signal-blue shrink-0" />
                ) : (
                  <FileIcon size={14} className="text-base-500 shrink-0" />
                )}
                {renaming === item.name ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleRename(item)}
                    onBlur={() => handleRename(item)}
                    className="flex-1 rounded-md border border-accent bg-base-900 px-2 py-1 text-sm text-base-100 outline-none"
                  />
                ) : (
                  <span
                    onClick={() =>
                      item.isDirectory ? load(joinPath(path, item.name)) : setEditingPath(joinPath(path, item.name))
                    }
                    className="flex-1 cursor-pointer truncate text-base-200"
                  >
                    {item.name}
                  </span>
                )}
                <button
                  onClick={() => startRename(item)}
                  className="hidden text-base-500 hover:text-accent group-hover:block"
                >
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="hidden text-base-500 hover:text-signal-rose group-hover:block"
                >
                  <Trash size={13} />
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-base-500">Dossier vide</p>}
          </>
        )}
      </div>

      {editingPath && <NanoEditor serverId={serverId} path={editingPath} onClose={() => setEditingPath(null)} />}
    </div>
  );
}
