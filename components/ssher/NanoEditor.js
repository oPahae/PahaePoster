import { useEffect, useState } from "react";
import axios from "axios";
import { Save, X } from "lucide-react";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";
import CodeEditor from "../layout/CodeEditor";

export default function NanoEditor({ serverId, path, onClose }) {
  const { notify } = useNotification();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get("/api/ssher/file", { params: { id: serverId, path } })
      .then(({ data }) => setContent(data.content))
      .catch((error) => notify(error?.response?.data?.error || error.message, "error"))
      .finally(() => setLoading(false));
  }, [serverId, path, notify]);

  async function handleSave() {
    setSaving(true);
    try {
      await axios.post("/api/ssher/file", { id: serverId, path, content });
      notify("Fichier enregistre", "success");
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-4xl flex-col animate-scale-in rounded-xl border border-base-700 bg-base-900 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-3">
          <p className="font-mono text-xs text-base-300">{path}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save size={13} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button onClick={onClose} className="text-base-500 hover:text-base-200">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader label="Chargement du fichier..." />
            </div>
          ) : (
            <CodeEditor value={content} onChange={setContent} filename={path} />
          )}
        </div>
      </div>
    </div>
  );
}
