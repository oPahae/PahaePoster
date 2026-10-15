import { useMemo } from "react";
import { AlignLeft, AlertCircle } from "lucide-react";
import { safeJsonParse } from "../../lib/utils";

export default function JsonEditor({ value, onChange }) {
  const { error } = useMemo(() => (value.trim() ? safeJsonParse(value) : { error: null }), [value]);

  function formatJson() {
    const { value: parsed, error: parseError } = safeJsonParse(value);
    if (!parseError) onChange(JSON.stringify(parsed, null, 2));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-base-500">Body JSON</span>
        <button
          onClick={formatJson}
          className="flex items-center gap-1.5 rounded-md border border-base-700 px-2.5 py-1 text-[11px] text-base-400 hover:border-accent hover:text-accent"
        >
          <AlignLeft size={12} /> Formater
        </button>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={`{\n  "cle": "valeur"\n}`}
        className="h-48 w-full resize-none rounded-md border border-base-700 bg-base-900 px-3 py-2 font-mono text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
      />
      {error && value.trim() && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-signal-rose">
          <AlertCircle size={12} /> JSON invalide : {error}
        </p>
      )}
    </div>
  );
}
