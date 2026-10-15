import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Upload, Download, Trash, Link as LinkIcon, File as FileIcon, Image as ImageIcon, FileVideo, FileAudio, FileText, FileArchive } from "lucide-react";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function iconFor(type) {
  if (type === "image") return ImageIcon;
  if (type === "video") return FileVideo;
  if (type === "audio") return FileAudio;
  if (type === "document") return FileText;
  if (type === "archive") return FileArchive;
  return FileIcon;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function MediaTab({ code, registerReload }) {
  const { notify, confirm } = useNotification();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/sharer/${code}/files`);
      setFiles(data.files);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [code, notify]);

  useEffect(() => {
    load();
    if (registerReload) registerReload(load);
  }, [load, registerReload]);

  async function uploadFiles(fileList) {
    const list = Array.from(fileList || []);
    if (list.length === 0) return;
    const formData = new FormData();
    list.forEach((file) => formData.append("files", file));
    const uploadId = Date.now() + Math.random();
    setUploads((current) => [...current, { id: uploadId, progress: 0, names: list.map((file) => file.name) }]);
    try {
      await axios.post(`/api/sharer/${code}/files`, formData, {
        onUploadProgress: (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setUploads((current) => current.map((item) => (item.id === uploadId ? { ...item, progress } : item)));
        }
      });
      notify("Envoi termine", "success");
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setUploads((current) => current.filter((item) => item.id !== uploadId));
    }
  }

  async function handleDelete(file) {
    const confirmed = await confirm({
      title: `Supprimer ${file.name}`,
      description: "Cette action est irreversible.",
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axios.delete(`/api/sharer/${code}/files/${encodeURIComponent(file.name)}`);
      notify("Fichier supprime", "success");
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  async function handleDeleteAll() {
    if (files.length === 0 || busy) return;
    const confirmed = await confirm({
      title: `Supprimer ${files.length} fichier${files.length > 1 ? "s" : ""}`,
      description: "Tous les fichiers partages seront supprimes. Cette action est irreversible.",
      confirmLabel: "Tout supprimer",
      danger: true
    });
    if (!confirmed) return;

    setBusy(true);
    try {
      const results = await Promise.allSettled(
        files.map((file) => axios.delete(`/api/sharer/${code}/files/${encodeURIComponent(file.name)}`))
      );
      const failed = results.filter((result) => result.status === "rejected").length;
      const succeeded = results.length - failed;
      if (failed === 0) {
        notify(`${succeeded} fichier${succeeded > 1 ? "s" : ""} supprime${succeeded > 1 ? "s" : ""}`, "success");
      } else {
        notify(`${succeeded} supprime(s), ${failed} echec(s)`, "error");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadAll() {
    if (files.length === 0 || busy) return;
    setBusy(true);
    try {
      for (const file of files) {
        const link = document.createElement("a");
        link.href = `/api/sharer/${code}/files/${encodeURIComponent(file.name)}`;
        link.download = file.name;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // petit delai pour eviter que le navigateur bloque les telechargements multiples
        await sleep(350);
      }
      notify(`Telechargement de ${files.length} fichier${files.length > 1 ? "s" : ""} lance`, "success");
    } finally {
      setBusy(false);
    }
  }

  function copyLink(file) {
    const url = `${window.location.origin}/api/sharer/${code}/files/${encodeURIComponent(file.name)}`;
    navigator.clipboard.writeText(url);
    notify("Lien copie", "success");
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
          dragging ? "scale-[1.01] border-accent bg-accent/5 shadow-glow-sm" : "border-base-700 hover:border-base-600 hover:bg-base-900/50"
        }`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            dragging ? "bg-accent/15 text-accent" : "bg-base-800 text-base-500"
          }`}
        >
          <Upload size={20} />
        </span>
        <div>
          <p className="text-sm font-medium text-base-200">Glisse des fichiers ici</p>
          <p className="mt-0.5 text-xs text-base-500">ou clique pour choisir depuis ton appareil</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files)} />
      </div>

      {uploads.map((upload) => (
        <div key={upload.id} className="mt-3 rounded-md border border-base-700 bg-base-900 px-3 py-2">
          <p className="truncate text-xs text-base-400">{upload.names.join(", ")}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-base-800">
            <div className="h-full bg-accent transition-all" style={{ width: `${upload.progress}%` }} />
          </div>
        </div>
      ))}

      <div className="mt-4">
        {loading ? (
          <Loader label="Chargement des fichiers..." />
        ) : files.length === 0 ? (
          <div className="flex animate-fade-in flex-col items-center gap-2 py-10 text-center text-sm text-base-500"><FileIcon size={20} className="text-base-700" />Aucun fichier partage</div>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-base-400">
                <span className="font-medium text-base-200">{files.length}</span>{" "}
                {files.length > 1 ? "elements" : "element"} - {formatSize(totalSize)} au total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAll}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-base-700 bg-base-900 px-2.5 py-1 text-xs text-base-200 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={13} />
                  Tout telecharger
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-base-700 bg-base-900 px-2.5 py-1 text-xs text-base-200 transition-colors hover:border-signal-rose hover:text-signal-rose disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash size={13} />
                  Tout supprimer
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {files.map((file) => {
                const Icon = iconFor(file.type);
                return (
                  <div key={file.name} className="group flex items-center gap-3 rounded-md border border-base-800 bg-base-900 px-3 py-2 transition-colors hover:border-base-700 hover:bg-base-850">
                    <Icon size={16} className="shrink-0 text-base-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-base-100">{file.name}</p>
                      <p className="text-[11px] text-base-500">
                        {formatSize(file.size)} - {new Date(file.modifiedAt).toLocaleString()} - {file.type}
                      </p>
                    </div>
                    <a
                      href={`/api/sharer/${code}/files/${encodeURIComponent(file.name)}`}
                      className="text-base-500 hover:text-accent"
                      title="Telecharger"
                    >
                      <Download size={14} />
                    </a>
                    <button onClick={() => copyLink(file)} title="Copier le lien" className="text-base-500 hover:text-accent">
                      <LinkIcon size={14} />
                    </button>
                    <button onClick={() => handleDelete(file)} title="Supprimer" className="text-base-500 hover:text-signal-rose">
                      <Trash size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}