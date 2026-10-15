import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { COMMON_HEADERS } from "../../lib/httpHeaders";

export default function HeadersEditor({ headers, onChange }) {
  const [openIndex, setOpenIndex] = useState(null);

  function updateHeader(index, field, value) {
    const next = headers.map((header, headerIndex) => (headerIndex === index ? { ...header, [field]: value } : header));
    onChange(next);
  }

  function addHeader() {
    onChange([...headers, { key: "", value: "" }]);
  }

  function removeHeader(index) {
    onChange(headers.filter((_, headerIndex) => headerIndex !== index));
  }

  function pickSuggestion(index, name) {
    updateHeader(index, "key", name);
    setOpenIndex(null);
  }

  return (
    <div className="space-y-2">
      {headers.map((header, index) => {
        const query = header.key.toLowerCase();
        const suggestions = COMMON_HEADERS.filter((name) => name.toLowerCase().includes(query)).slice(0, 6);
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="relative w-1/3">
              <input
                value={header.key}
                onChange={(event) => updateHeader(index, "key", event.target.value)}
                onFocus={() => setOpenIndex(index)}
                onBlur={() => setTimeout(() => setOpenIndex((current) => (current === index ? null : current)), 120)}
                placeholder="Cle"
                className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
              />
              {openIndex === index && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-md border border-base-700 bg-base-850 shadow-panel">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        pickSuggestion(index, name);
                      }}
                      className="block w-full px-3 py-1.5 text-left font-mono text-xs text-base-300 hover:bg-base-800 hover:text-accent"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              value={header.value}
              onChange={(event) => updateHeader(index, "value", event.target.value)}
              placeholder="Valeur"
              className="flex-1 rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
            <button onClick={() => removeHeader(index)} className="text-base-500 hover:text-signal-rose">
              <Trash size={14} />
            </button>
          </div>
        );
      })}
      <button
        onClick={addHeader}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-base-700 px-3 py-1.5 text-xs text-base-400 hover:border-accent hover:text-accent"
      >
        <Plus size={13} /> Ajouter un header
      </button>
    </div>
  );
}
