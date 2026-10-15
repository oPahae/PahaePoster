import { useRef, useState } from "react";
import { makeId } from "../../lib/classDiagramSyntax";

const SYMBOLS = ["+", "-", "#", "~"];

function guessType(name) {
  const lower = (name || "").toLowerCase();
  if (lower === "id" || lower.endsWith("id")) return "int";
  if (lower.startsWith("date")) return "date";
  if (lower.startsWith("est") || lower.startsWith("is") || lower.startsWith("has")) return "boolean";
  if (["prix", "montant", "total", "salaire"].some((needle) => lower.includes(needle))) return "double";
  return "string";
}

export default function EditableRows({ rows, onChange, isMethod, nameSuggestions, typeSuggestions, onCommitRow }) {
  const [openSuggestion, setOpenSuggestion] = useState(null);
  const fieldRefs = useRef({});

  function setFieldRef(rowId, field, element) {
    fieldRefs.current[`${rowId}-${field}`] = element;
  }

  function focusField(rowId, field) {
    requestAnimationFrame(() => {
      const element = fieldRefs.current[`${rowId}-${field}`];
      if (element) element.focus();
    });
  }

  function ensureTrailingRow(nextRows) {
    if (nextRows.length === 0 || nextRows[nextRows.length - 1].name.trim() !== "") {
      return [...nextRows, { id: makeId(), visibility: isMethod ? "+" : "-", name: "", type: "" }];
    }
    return nextRows;
  }

  function updateRow(rowId, patch) {
    const next = rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    onChange(next);
  }

  function handleNameChange(rowId, value) {
    let visibility = rows.find((row) => row.id === rowId).visibility;
    let name = value;
    if (value.length > 0 && SYMBOLS.includes(value[0])) {
      visibility = value[0];
      name = value.slice(1);
    }
    updateRow(rowId, { visibility, name });
    setOpenSuggestion(name.length > 0 ? `${rowId}-name` : null);
  }

  function handleTypeChange(rowId, value) {
    updateRow(rowId, { type: value });
    setOpenSuggestion(value.length > 0 ? `${rowId}-type` : null);
  }

  function commitRow(rowId) {
    const row = rows.find((item) => item.id === rowId);
    if (!row || !row.name.trim()) return;
    const finalType = row.type && row.type.trim() ? row.type.trim() : guessType(row.name);
    const finalRow = { ...row, name: row.name.trim(), type: finalType };
    const next = ensureTrailingRow(rows.map((item) => (item.id === rowId ? finalRow : item)));
    onChange(next);
    if (onCommitRow) onCommitRow(finalRow);
    return next;
  }

  function rowIndex(rowId) {
    return rows.findIndex((row) => row.id === rowId);
  }

  function handleNameKeyDown(event, rowId) {
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      setOpenSuggestion(null);
      focusField(rowId, "type");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const index = rowIndex(rowId);
      if (index < rows.length - 1) focusField(rows[index + 1].id, "name");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const index = rowIndex(rowId);
      if (index > 0) focusField(rows[index - 1].id, "name");
      return;
    }
    if (event.key === "Backspace" && event.target.value === "") {
      const index = rowIndex(rowId);
      if (rows.length > 1) {
        event.preventDefault();
        const next = rows.filter((row) => row.id !== rowId);
        onChange(ensureTrailingRow(next));
        if (index > 0) focusField(rows[index - 1].id, "type");
      }
    }
  }

  function handleTypeKeyDown(event, rowId) {
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      setOpenSuggestion(null);
      const next = commitRow(rowId);
      if (!next) return;
      const index = rowIndex(rowId);
      if (index < rows.length - 1) {
        focusField(rows[index + 1].id, "name");
      } else {
        focusField(next[next.length - 1].id, "name");
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const index = rowIndex(rowId);
      if (index < rows.length - 1) focusField(rows[index + 1].id, "type");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const index = rowIndex(rowId);
      if (index > 0) focusField(rows[index - 1].id, "type");
      return;
    }
    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      focusField(rowId, "name");
    }
  }

  function removeRow(rowId) {
    const next = rows.filter((row) => row.id !== rowId);
    onChange(ensureTrailingRow(next));
  }

  return (
    <div>
      {rows.map((row) => {
        const nameSuggestionsFiltered = row.name
          ? (nameSuggestions || []).filter((item) => item.toLowerCase().startsWith(row.name.toLowerCase()) && item.toLowerCase() !== row.name.toLowerCase()).slice(0, 6)
          : [];
        const typeSuggestionsFiltered = row.type
          ? (typeSuggestions || []).filter((item) => item.toLowerCase().startsWith(row.type.toLowerCase()) && item.toLowerCase() !== row.type.toLowerCase()).slice(0, 6)
          : [];

        return (
          <div key={row.id} className="group flex items-center gap-1 px-2 py-0.5 text-[11px] leading-5 hover:bg-base-800/60">
            <button
              onClick={() => {
                const cycle = SYMBOLS;
                const nextSymbol = cycle[(cycle.indexOf(row.visibility) + 1) % cycle.length];
                updateRow(row.id, { visibility: nextSymbol });
              }}
              className="w-3 shrink-0 text-center font-mono text-accent"
              title="Cliquer pour changer la visibilite"
            >
              {row.visibility}
            </button>
            <div className="relative min-w-0 flex-1">
              <input
                ref={(element) => setFieldRef(row.id, "name", element)}
                value={row.name}
                onChange={(event) => handleNameChange(row.id, event.target.value)}
                onKeyDown={(event) => handleNameKeyDown(event, row.id)}
                onFocus={() => setOpenSuggestion(row.name ? `${row.id}-name` : null)}
                onBlur={() => setTimeout(() => setOpenSuggestion(null), 120)}
                placeholder={isMethod ? "nomMethode" : "attribut"}
                className="w-full min-w-0 truncate bg-transparent font-mono text-base-100 outline-none placeholder:text-base-600"
              />
              {openSuggestion === `${row.id}-name` && nameSuggestionsFiltered.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-base-700 bg-base-850 shadow-panel">
                  {nameSuggestionsFiltered.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        updateRow(row.id, { name: suggestion });
                        setOpenSuggestion(null);
                        focusField(row.id, "type");
                      }}
                      className="block w-full px-2.5 py-1 text-left font-mono text-[11px] text-base-300 hover:bg-base-800 hover:text-accent"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-base-600">{isMethod ? "():" : ":"}</span>
            <div className="relative w-20 shrink-0">
              <input
                ref={(element) => setFieldRef(row.id, "type", element)}
                value={row.type}
                onChange={(event) => handleTypeChange(row.id, event.target.value)}
                onKeyDown={(event) => handleTypeKeyDown(event, row.id)}
                onFocus={() => setOpenSuggestion(row.type ? `${row.id}-type` : null)}
                onBlur={() => setTimeout(() => setOpenSuggestion(null), 120)}
                placeholder="type"
                className="w-full truncate bg-transparent font-mono text-signal-blue outline-none placeholder:text-base-600"
              />
              {openSuggestion === `${row.id}-type` && typeSuggestionsFiltered.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-md border border-base-700 bg-base-850 shadow-panel">
                  {typeSuggestionsFiltered.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        updateRow(row.id, { type: suggestion });
                        setOpenSuggestion(null);
                      }}
                      className="block w-full px-2.5 py-1 text-left font-mono text-[11px] text-base-300 hover:bg-base-800 hover:text-accent"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {row.name && (
              <button
                onClick={() => removeRow(row.id)}
                className="hidden w-3 shrink-0 text-base-600 hover:text-signal-rose group-hover:block"
              >
                x
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
