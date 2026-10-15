import { useState } from "react";
import axios from "axios";
import { X, Sparkles } from "lucide-react";
import { parseDiagramSyntax } from "../../lib/classDiagramSyntax";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";

export default function AiGenerateModal({ onClose, onGenerated }) {
  const { notify } = useNotification();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawPreview, setRawPreview] = useState("");

  async function handleGenerate() {
    if (!context.trim()) {
      notify("Decris ton projet pour generer un diagramme", "error");
      return;
    }
    setLoading(true);
    setRawPreview("");
    try {
      const { data } = await axios.post("/api/classer/generate", { context });
      const parsed = parseDiagramSyntax(data.raw);
      if (parsed.classes.length === 0) {
        setRawPreview(data.raw);
        notify("L'IA n'a pas retourne un format reconnu, verifie l'apercu ci-dessous", "error");
        return;
      }
      onGenerated(parsed);
      notify(`${parsed.classes.length} classe(s) generee(s)`, "success");
      onClose();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-base-700 bg-base-850 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-base-100">
            <Sparkles size={15} className="text-accent" /> Generer avec l'IA
          </h3>
          <button onClick={onClose} className="text-base-500 hover:text-base-200">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs text-base-400">Decris le contexte de ton projet</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Exemple: une plateforme e-commerce avec des clients, des produits, des commandes et des paiements..."
              className="h-36 w-full resize-none rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
          </label>
          {rawPreview && (
            <div>
              <p className="mb-1 text-xs text-base-500">Reponse brute de l'IA</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-base-700 bg-base-900 p-2 font-mono text-[11px] text-base-400">
                {rawPreview}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-base-800 px-5 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-base-400 hover:bg-base-800">
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader size={13} /> : <Sparkles size={13} />}
            {loading ? "Generation..." : "Generer"}
          </button>
        </div>
      </div>
    </div>
  );
}
