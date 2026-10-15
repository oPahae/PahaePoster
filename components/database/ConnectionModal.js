import { useState } from "react";
import { X, PlugZap } from "lucide-react";
import axios from "axios";
import { defaultPortFor } from "../../lib/utils";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";

export default function ConnectionModal({ connection, onClose, onSaved }) {
  const { notify } = useNotification();
  const [form, setForm] = useState({
    name: connection?.name || "",
    type: connection?.type || "mysql",
    host: connection?.host || "localhost",
    port: connection?.port || defaultPortFor("mysql"),
    user: connection?.user || "root",
    password: "",
    database: connection?.database || ""
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "type") next.port = defaultPortFor(value);
      return next;
    });
  }

  async function handleTest() {
    setTesting(true);
    try {
      const { data } = await axios.post("/api/database/test", form);
      if (data.success) notify("Connexion reussie", "success");
      else notify(data.error || "Echec de connexion", "error");
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (connection) {
        await axios.put(`/api/database/connections/${connection.id}`, form);
        notify("Connexion mise a jour", "success");
      } else {
        await axios.post("/api/database/connections", form);
        notify("Connexion enregistree", "success");
      }
      onSaved();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md animate-scale-in rounded-xl border border-base-700 bg-base-850 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-base-100">
            {connection ? "Modifier la connexion" : "Nouvelle connexion"}
          </h3>
          <button onClick={onClose} className="text-base-500 hover:text-base-200">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <Field label="Nom">
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
              placeholder="Ma base de production"
            />
          </Field>

          <Field label="Type">
            <select
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            >
              <option value="mysql">MySQL</option>
              <option value="postgres">PostgreSQL</option>
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Host">
                <input
                  value={form.host}
                  onChange={(event) => updateField("host", event.target.value)}
                  className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
                />
              </Field>
            </div>
            <Field label="Port">
              <input
                value={form.port}
                onChange={(event) => updateField("port", event.target.value)}
                className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
              />
            </Field>
          </div>

          <Field label="Utilisateur">
            <input
              value={form.user}
              onChange={(event) => updateField("user", event.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
          </Field>

          <Field label="Mot de passe">
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={connection ? "Laisser vide pour ne pas changer" : ""}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
          </Field>

          <Field label="Base de donnees">
            <input
              value={form.database}
              onChange={(event) => updateField("database", event.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-base-800 px-5 py-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            {testing ? <Loader size={13} /> : <PlugZap size={13} />}
            Tester
          </button>
          <div className="flex gap-2">
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
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-base-400">{label}</span>
      {children}
    </label>
  );
}
