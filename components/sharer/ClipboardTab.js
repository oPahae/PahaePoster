import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Copy, Trash, Plus, Trash2 } from "lucide-react";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";

export default function ClipboardTab({ code, registerReload }) {
  const { notify, confirm } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/sharer/${code}/clipboard`);
      setItems(data.items);
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

  async function handleAdd() {
    if (!draft.trim()) return;
    try {
      const device = navigator.userAgent.includes("Mobile") ? "Mobile" : "Ordinateur";
      await axios.post(`/api/sharer/${code}/clipboard`, { text: draft, device });
      setDraft("");
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`/api/sharer/${code}/clipboard/${id}`);
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  async function handleClearAll() {
    const confirmed = await confirm({
      title: "Vider le presse-papiers",
      description: "Tous les elements seront supprimes.",
      confirmLabel: "Vider",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axios.delete(`/api/sharer/${code}/clipboard`);
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
    notify("Copie", "success");
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Ecrire ou coller du texte puis Entree"
          className="h-16 flex-1 resize-none rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-md bg-accent/10 px-3 text-xs font-medium text-accent transition-transform hover:scale-[1.02] hover:bg-accent/20 active:scale-[0.98]"
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        {items.length > 0 && (
          <button onClick={handleClearAll} className="flex items-center gap-1.5 text-xs text-base-500 hover:text-signal-rose">
            <Trash2 size={12} /> Tout supprimer
          </button>
        )}
      </div>

      <div className="mt-2 space-y-2">
        {loading ? (
          <Loader label="Chargement..." />
        ) : items.length === 0 ? (
          <div className="flex animate-fade-in flex-col items-center gap-2 py-10 text-center text-sm text-base-500"><Copy size={20} className="text-base-700" />Aucun element</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-md border border-base-800 bg-base-900 px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-sm text-base-100">{item.text}</p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-base-500">
                <span>
                  {item.device} - {new Date(item.createdAt).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => copyText(item.text)} className="hover:text-accent">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="hover:text-signal-rose">
                    <Trash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
