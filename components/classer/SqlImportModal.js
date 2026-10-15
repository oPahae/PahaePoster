import { useState } from "react";
import { X, Database } from "lucide-react";
import { parseSqlToDiagram } from "../../lib/sqlDiagramImport";
import { useNotification } from "../layout/NotificationContext";

const PLACEHOLDER = `CREATE TABLE users (
  id INT PRIMARY KEY,
  nom VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  total DECIMAL(10,2),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

export default function SqlImportModal({ onClose, onGenerated }) {
  const { notify } = useNotification();
  const [sql, setSql] = useState("");

  function handleImport() {
    if (!sql.trim()) {
      notify("Colle du code SQL a importer", "error");
      return;
    }
    const parsed = parseSqlToDiagram(sql);
    if (parsed.classes.length === 0) {
      notify("Aucune instruction CREATE TABLE reconnue", "error");
      return;
    }
    onGenerated(parsed);
    notify(`${parsed.classes.length} classe(s) importee(s) depuis le SQL`, "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-base-700 bg-base-850 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-base-100">
            <Database size={15} className="text-accent" /> Importer depuis du SQL
          </h3>
          <button onClick={onClose} className="text-base-500 hover:text-base-200">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs text-base-400">Colle une ou plusieurs instructions CREATE TABLE</span>
            <textarea
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              className="h-56 w-full resize-none rounded-md border border-base-700 bg-base-900 px-3 py-2 font-mono text-xs text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
          </label>
          <p className="mt-2 text-[11px] text-base-500">
            Les cles primaires deviennent des attributs publics, les autres colonnes des attributs prives avec leur
            getter. Les FOREIGN KEY deviennent des relations d'association.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-base-800 px-5 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-base-400 hover:bg-base-800">
            Annuler
          </button>
          <button onClick={handleImport} className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Database size={13} />
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}
