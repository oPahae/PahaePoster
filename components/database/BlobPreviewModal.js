import { X, Download, FileWarning } from "lucide-react";

function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export default function BlobPreviewModal({ blob, columnName, onClose }) {
  const dataUrl = blob.base64 ? `data:${blob.mime};base64,${blob.base64}` : null;
  const isImage = blob.mime.startsWith("image/");
  const isVideo = blob.mime.startsWith("video/");
  const isAudio = blob.mime.startsWith("audio/");
  const isPdf = blob.mime === "application/pdf";
  const isText = blob.mime === "text/plain";

  function download() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${columnName || "fichier"}`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-3xl flex-col animate-scale-in rounded-xl border border-base-700 bg-base-900 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-base-100">{columnName}</p>
            <p className="text-[11px] text-base-500">
              {blob.mime} - {blob.size ? `${(blob.size / 1024).toFixed(1)} Ko` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dataUrl && (
              <button
                onClick={download}
                className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
              >
                <Download size={13} /> Telecharger
              </button>
            )}
            <button onClick={onClose} className="text-base-500 hover:text-base-200">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-base-950 p-4">
          {blob.tooLarge && (
            <div className="flex flex-col items-center gap-2 text-sm text-base-500">
              <FileWarning size={24} />
              Fichier trop volumineux pour un apercu ({(blob.size / (1024 * 1024)).toFixed(1)} Mo)
            </div>
          )}
          {!blob.tooLarge && isImage && (
            <img src={dataUrl} alt={columnName} className="max-h-full max-w-full rounded-md object-contain" />
          )}
          {!blob.tooLarge && isVideo && <video src={dataUrl} controls className="max-h-full max-w-full rounded-md" />}
          {!blob.tooLarge && isAudio && <audio src={dataUrl} controls className="w-full" />}
          {!blob.tooLarge && isPdf && <iframe src={dataUrl} title={columnName} className="h-full w-full rounded-md bg-white" />}
          {!blob.tooLarge && isText && (
            <pre className="max-h-full w-full overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-base-300">
              {base64ToUtf8(blob.base64)}
            </pre>
          )}
          {!blob.tooLarge && !isImage && !isVideo && !isAudio && !isPdf && !isText && (
            <div className="flex flex-col items-center gap-2 text-sm text-base-500">
              <FileWarning size={24} />
              Aucun apercu disponible pour ce type de contenu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
