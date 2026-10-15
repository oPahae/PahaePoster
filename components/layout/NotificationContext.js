import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const NotificationContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const accents = {
  success: "border-accent/30 text-accent",
  error: "border-signal-rose/30 text-signal-rose",
  warning: "border-signal-amber/30 text-signal-amber",
  info: "border-signal-blue/30 text-signal-blue"
};

const badgeAccents = {
  success: "bg-accent/15 text-accent",
  error: "bg-signal-rose/15 text-signal-rose",
  warning: "bg-signal-amber/15 text-signal-amber",
  info: "bg-signal-blue/15 text-signal-blue"
};

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const counter = useRef(0);

  const notify = useCallback((message, type = "info") => {
    counter.current += 1;
    const toastId = counter.current;
    setToasts((current) => [...current, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== toastId));
    }, 4200);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || "Confirmer l'action",
        description: options.description || "",
        confirmLabel: options.confirmLabel || "Confirmer",
        cancelLabel: options.cancelLabel || "Annuler",
        danger: Boolean(options.danger),
        onResolve: (value) => {
          setConfirmState(null);
          resolve(value);
        }
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`glass-panel flex animate-slide-up items-start gap-3 rounded-lg border px-4 py-3 shadow-modal ${accents[toast.type]}`}
            >
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${badgeAccents[toast.type]}`}>
                <Icon size={13} />
              </span>
              <p className="pt-0.5 text-sm leading-snug text-base-200">{toast.message}</p>
              <button
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="ml-auto shrink-0 text-base-500 hover:text-base-200"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm animate-scale-in rounded-xl border border-base-700 p-5 shadow-modal">
            <h3 className="text-base font-semibold text-base-100">{confirmState.title}</h3>
            {confirmState.description && (
              <p className="mt-2 text-sm leading-relaxed text-base-400">{confirmState.description}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => confirmState.onResolve(false)}
                className="rounded-md px-3 py-1.5 text-sm text-base-300 hover:bg-base-800"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                onClick={() => confirmState.onResolve(true)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98] ${
                  confirmState.danger ? "bg-signal-rose text-base-950" : "bg-accent text-base-950"
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification doit etre utilise dans NotificationProvider");
  return context;
}
