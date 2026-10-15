import { useState } from "react";
import { X } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "association", label: "Association" },
  { value: "aggregation", label: "Agregation" },
  { value: "composition", label: "Composition" },
  { value: "inheritance", label: "Heritage" },
  { value: "realization", label: "Realisation" },
  { value: "dependency", label: "Dependance" }
];

const CARDINALITY_OPTIONS = ["1", "0..1", "1..*", "0..*", "*"];

export default function RelationModal({ fromName, toName, onConfirm, onCancel }) {
  const [type, setType] = useState("association");
  const [fromCardinality, setFromCardinality] = useState("1");
  const [toCardinality, setToCardinality] = useState("0..*");

  const isHierarchy = type === "inheritance" || type === "realization";
  const wholeLabel = type === "aggregation" || type === "composition" ? "contenant" : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm animate-scale-in rounded-xl border border-base-700 bg-base-850 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-base-100">
            {fromName} <span className="text-base-500">-&gt;</span> {toName}
          </h3>
          <button onClick={onCancel} className="text-base-500 hover:text-base-200">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs text-base-400">Type de relation</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {wholeLabel && (
              <p className="mt-1 text-[11px] text-base-500">
                {fromName} est le {wholeLabel}, {toName} en fait partie.
              </p>
            )}
            {isHierarchy && (
              <p className="mt-1 text-[11px] text-base-500">
                {toName} est la classe parente de {fromName}.
              </p>
            )}
          </label>

          {!isHierarchy && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-base-400">Cardinalite {fromName}</span>
                <select
                  value={fromCardinality}
                  onChange={(event) => setFromCardinality(event.target.value)}
                  className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
                >
                  {CARDINALITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-base-400">Cardinalite {toName}</span>
                <select
                  value={toCardinality}
                  onChange={(event) => setToCardinality(event.target.value)}
                  className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
                >
                  {CARDINALITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-base-800 px-5 py-4">
          <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs text-base-400 hover:bg-base-800">
            Annuler
          </button>
          <button
            onClick={() =>
              onConfirm({
                type,
                fromCardinality: isHierarchy ? "" : fromCardinality,
                toCardinality: isHierarchy ? "" : toCardinality
              })
            }
            className="rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Creer la relation
          </button>
        </div>
      </div>
    </div>
  );
}
