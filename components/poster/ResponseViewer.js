import { JsonView, darkStyles } from "react-json-view-lite";
import { Send } from "lucide-react";
import { formatDuration, classNames } from "../../lib/utils";

function statusColor(status) {
  if (status >= 200 && status < 300) return "text-accent bg-accent/10 ring-1 ring-accent/20";
  if (status >= 300 && status < 400) return "text-signal-blue bg-signal-blue/10 ring-1 ring-signal-blue/20";
  if (status >= 400) return "text-signal-rose bg-signal-rose/10 ring-1 ring-signal-rose/20";
  return "text-base-400 bg-base-800";
}

export default function ResponseViewer({ response }) {
  if (!response) {
    return (
      <div className="flex h-full animate-fade-in flex-col items-center justify-center gap-2 text-sm text-base-500">
        <Send size={22} className="text-base-700" />
        Envoie une requete pour voir la reponse
      </div>
    );
  }

  const isJson = response.data && typeof response.data === "object";

  return (
    <div className="flex h-full animate-fade-in flex-col">
      <div className="flex items-center gap-3 border-b border-base-800 px-4 py-2.5">
        <span className={classNames("rounded px-2 py-0.5 font-mono text-xs font-semibold", statusColor(response.status))}>
          {response.status || "ERR"} {response.statusText}
        </span>
        <span className="text-xs text-base-500">{formatDuration(response.durationMs)}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isJson ? (
          <JsonView data={response.data} shouldExpandNode={(level) => level < 2} style={darkStyles} />
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-base-300">{String(response.data)}</pre>
        )}
      </div>
    </div>
  );
}
