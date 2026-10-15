import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Play, Eye } from "lucide-react";
import { formatDuration } from "../../lib/utils";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";
import BlobPreviewModal from "./BlobPreviewModal";

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP", "BY", "ORDER", "LIMIT",
  "OFFSET", "AND", "OR", "NOT", "NULL", "AS", "DISTINCT", "COUNT", "SUM", "AVG",
  "MIN", "MAX", "CREATE", "TABLE", "ALTER", "DROP", "HAVING", "LIKE", "IN", "BETWEEN"
];

function highlight(sql) {
  const escaped = sql
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/('[^']*')/g, '<span class="text-signal-amber">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-signal-violet">$1</span>')
    .replace(new RegExp(`\\b(${KEYWORDS.join("|")})\\b`, "gi"), '<span class="text-accent font-medium">$1</span>');
}

export default function SqlEditor({ connectionId, activeTable }) {
  const { notify } = useNotification();
  const [sql, setSql] = useState("SELECT * FROM ");
  const [tables, setTables] = useState([]);
  const [schemaCache, setSchemaCache] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [previewBlob, setPreviewBlob] = useState(null);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    axios.post("/api/database/tables", { id: connectionId }).then(({ data }) => setTables(data.tables || []));
  }, [connectionId]);

  useEffect(() => {
    if (!activeTable) return;
    setSql(`SELECT * FROM ${activeTable} LIMIT 100`);
  }, [activeTable]);

  const allColumns = useMemo(() => Object.values(schemaCache).flat(), [schemaCache]);

  async function ensureSchema(tableName) {
    if (schemaCache[tableName]) return;
    try {
      const { data } = await axios.post("/api/database/schema", { id: connectionId, table: tableName });
      setSchemaCache((current) => ({ ...current, [tableName]: data.columns.map((column) => column.column) }));
    } catch (error) {
      setSchemaCache((current) => current);
    }
  }

  function handleChange(event) {
    const value = event.target.value;
    setSql(value);

    const cursor = event.target.selectionStart;
    const beforeCursor = value.slice(0, cursor);
    const wordMatch = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const word = wordMatch ? wordMatch[0] : "";

    if (word.length >= 2) {
      const pool = [...KEYWORDS, ...tables, ...allColumns];
      const matches = [...new Set(pool)].filter((candidate) =>
        candidate.toLowerCase().startsWith(word.toLowerCase()) && candidate.toLowerCase() !== word.toLowerCase()
      );
      setSuggestions(matches.slice(0, 8));
      setSuggestionIndex(0);
    } else {
      setSuggestions([]);
    }

    const fromMatch = beforeCursor.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)$/i);
    if (fromMatch) ensureSchema(fromMatch[1]);
  }

  function applySuggestion(suggestion) {
    const textarea = textareaRef.current;
    const cursor = textarea.selectionStart;
    const beforeCursor = sql.slice(0, cursor);
    const afterCursor = sql.slice(cursor);
    const wordMatch = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const start = wordMatch ? cursor - wordMatch[0].length : cursor;
    const nextValue = sql.slice(0, start) + suggestion + afterCursor;
    setSql(nextValue);
    setSuggestions([]);
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursor = start + suggestion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }

  function handleKeyDown(event) {
    if (suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSuggestionIndex((current) => (current + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
        return;
      }
      if (event.key === "Escape") {
        setSuggestions([]);
      }
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleExecute();
    }
  }

  async function handleExecute() {
    setRunning(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/database/query", { id: connectionId, sql });
      setResult(data);
    } catch (requestError) {
      const payload = requestError?.response?.data;
      setError(payload || { error: requestError.message });
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  function syncScroll() {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-base-800 bg-base-900/60 px-5 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-400">Editeur SQL</p>
        <button
          onClick={handleExecute}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-xs font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {running ? <Loader size={12} /> : <Play size={12} />}
          Executer
        </button>
      </div>

      <div className="relative h-40 shrink-0 border-b border-base-800 bg-base-900">
        <pre
          ref={highlightRef}
          className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-sm leading-6 text-base-300"
          dangerouslySetInnerHTML={{ __html: highlight(sql) + "\n" }}
        />
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          className="absolute inset-0 resize-none whitespace-pre-wrap break-words bg-transparent px-4 py-3 font-mono text-sm leading-6 text-transparent caret-base-100 outline-none"
        />
        {suggestions.length > 0 && (
          <div className="absolute left-4 top-16 z-10 w-56 overflow-hidden rounded-md border border-base-700 bg-base-850 shadow-panel">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applySuggestion(suggestion);
                }}
                className={`block w-full px-3 py-1.5 text-left font-mono text-xs ${
                  index === suggestionIndex ? "bg-accent/15 text-accent" : "text-base-300 hover:bg-base-800"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="rounded-md border border-signal-rose/40 bg-signal-rose/5 px-4 py-3 text-xs text-signal-rose">
            <p className="font-medium">Erreur SQL</p>
            <p className="mt-1 font-mono">{error.error}</p>
          </div>
        )}
        {result && (
          <div>
            <p className="mb-2 text-xs text-base-500">
              {result.rows?.length || 0} lignes - {formatDuration(result.durationMs)}
              {result.affectedRows != null && ` - ${result.affectedRows} lignes affectees`}
            </p>
            {result.rows?.length > 0 && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="border-b border-base-800 px-3 py-1.5 text-left text-xs text-base-400">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={index}>
                      {result.columns.map((column) => (
                        <td key={column} className="border-b border-base-800/60 px-3 py-1.5 text-base-300 whitespace-nowrap">
                          {row[column] && typeof row[column] === "object" && row[column].__pahaeBlob ? (
                            <button
                              onClick={() => setPreviewBlob({ blob: row[column], columnName: column })}
                              className="flex items-center gap-1.5 rounded-md border border-base-700 px-2 py-1 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
                            >
                              <Eye size={12} /> Voir
                            </button>
                          ) : (
                            String(row[column] ?? "")
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {previewBlob && (
        <BlobPreviewModal
          blob={previewBlob.blob}
          columnName={previewBlob.columnName}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </div>
  );
}
