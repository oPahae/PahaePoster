import { useState } from "react";
import axios from "axios";
import { Send, Radio } from "lucide-react";
import HeadersEditor from "./HeadersEditor";
import JsonEditor from "./JsonEditor";
import ResponseViewer from "./ResponseViewer";
import JsonStructureViewer from "./JsonStructureViewer";
import Loader from "../layout/Loader";
import { useNotification } from "../layout/NotificationContext";
import { classNames, safeJsonParse } from "../../lib/utils";

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const methodColors = {
  GET: "text-signal-blue",
  POST: "text-accent",
  PUT: "text-signal-amber",
  PATCH: "text-signal-violet",
  DELETE: "text-signal-rose"
};

export default function PosterModule() {
  const { notify } = useNotification();
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://api.example.com/users");
  const [headers, setHeaders] = useState([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("response");

  async function handleSend() {
    if (!url) {
      notify("L'URL est requise", "error");
      return;
    }
    let parsedBody;
    if (body.trim()) {
      const { value, error } = safeJsonParse(body);
      if (error) {
        notify(`Body JSON invalide : ${error}`, "error");
        return;
      }
      parsedBody = value;
    }
    const headerObject = {};
    headers.forEach((header) => {
      if (header.key) headerObject[header.key] = header.value;
    });

    setSending(true);
    try {
      const { data } = await axios.post("/api/poster/send", { method, url, headers: headerObject, body: parsedBody });
      setResponse(data);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-base-800 bg-base-900/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Send size={14} />
          </span>
          <h1 className="text-sm font-semibold text-base-100">API Poster</h1>
        </div>
        <p className="mt-1 pl-9 text-xs text-base-500">Construis et envoie des requetes HTTP</p>
      </div>

      <div className="flex items-center gap-2 border-b border-base-800 px-6 py-3">
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          className={classNames(
            "rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm font-bold outline-none transition-shadow focus:border-accent focus:shadow-glow-sm",
            methodColors[method]
          )}
        >
          {methods.map((item) => (
            <option key={item} value={item} className="text-base-100">
              {item}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="https://api.exemple.com/route"
          className="flex-1 rounded-md border border-base-700 bg-base-900 px-3 py-2 font-mono text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 rounded-md bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-base-950 shadow-glow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {sending ? <Loader size={14} /> : <Send size={14} />}
          Send
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 shrink-0 space-y-5 overflow-y-auto border-r border-base-800 px-6 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Headers</p>
            <HeadersEditor headers={headers} onChange={setHeaders} />
          </div>
          <JsonEditor value={body} onChange={setBody} />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-base-800 bg-base-900/60 px-4 py-2">
            <TabButton active={tab === "response"} onClick={() => setTab("response")} label="Response" />
            <TabButton active={tab === "headers"} onClick={() => setTab("headers")} label="Headers" />
            <TabButton active={tab === "structure"} onClick={() => setTab("structure")} label="Structure JSON" />
          </div>
          <div className="flex-1 overflow-hidden">
            {tab === "response" && <ResponseViewer response={response} />}
            {tab === "headers" && (
              <div className="h-full overflow-y-auto p-4">
                {response ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(response.headers || {}).map(([key, value]) => (
                        <tr key={key} className="border-b border-base-800/60">
                          <td className="py-1.5 pr-4 font-mono text-xs text-base-400">{key}</td>
                          <td className="py-1.5 font-mono text-xs text-base-200">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full animate-fade-in flex-col items-center justify-center gap-2 text-sm text-base-500">
                    <Radio size={22} className="text-base-700" />
                    Aucune reponse
                  </div>
                )}
              </div>
            )}
            {tab === "structure" && <JsonStructureViewer data={response?.data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "relative rounded-md px-3 py-1.5 text-xs font-medium",
        active ? "text-accent" : "text-base-400 hover:bg-base-800 hover:text-base-200"
      )}
    >
      {active && <span className="absolute inset-0 rounded-md bg-accent/10" />}
      <span className="relative">{label}</span>
    </button>
  );
}
