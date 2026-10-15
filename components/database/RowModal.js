import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { useNotification } from "../layout/NotificationContext";

export default function RowModal({ connectionId, table, columns, row, onClose, onSaved }) {
  const { notify } = useNotification();
  const [values, setValues] = useState(() => {
    const initial = {};
    columns.forEach((column) => {
      const existing = row ? row[column.column] : "";
      initial[column.column] = existing && typeof existing === "object" && existing.__pahaeBlob ? "" : existing ?? "";
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (row) {
        const primaryKeyColumns = columns.filter((column) => column.key === "PRI");
        const primaryKey = {};
        (primaryKeyColumns.length ? primaryKeyColumns : columns.slice(0, 1)).forEach((column) => {
          primaryKey[column.column] = row[column.column];
        });
        await axios.put("/api/database/row", { id: connectionId, table, values, primaryKey });
      } else {
        await axios.post("/api/database/row", { id: connectionId, table, values });
      }
      notify("Ligne enregistree", "success");
      onSaved();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-base-700 bg-base-850 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-base-100">{row ? "Modifier la ligne" : "Ajouter une ligne"}</h3>
          <button onClick={onClose} className="text-base-500 hover:text-base-200">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {columns.map((column) => (
            <label key={column.column} className="block">
              <span className="mb-1 block text-xs text-base-400">
                {column.column} <span className="text-base-600">{column.type}</span>
              </span>
              <input
                value={values[column.column] ?? ""}
                onChange={(event) => updateField(column.column, event.target.value)}
                className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-base-800 px-5 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-base-400 hover:bg-base-800">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
