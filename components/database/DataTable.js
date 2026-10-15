import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search, Plus, Edit, Trash, ChevronLeft, ChevronRight, Eye, Table2 } from "lucide-react";
import { formatDuration } from "../../lib/utils";
import { useNotification } from "../layout/NotificationContext";
import Loader from "../layout/Loader";
import RowModal from "./RowModal";
import BlobPreviewModal from "./BlobPreviewModal";

export default function DataTable({ connectionId, table }) {
  const { notify, confirm } = useNotification();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [schema, setSchema] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalRow, setModalRow] = useState(undefined);
  const [previewBlob, setPreviewBlob] = useState(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dataResult, schemaResult] = await Promise.all([
        axios.post("/api/database/data", { id: connectionId, table, page, pageSize, search }),
        axios.post("/api/database/schema", { id: connectionId, table })
      ]);
      setRows(dataResult.data.rows);
      setColumns(dataResult.data.columns);
      setTotal(dataResult.data.total);
      setDurationMs(dataResult.data.durationMs);
      setSchema(schemaResult.data.columns);
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [connectionId, table, page, search, notify]);

  useEffect(() => {
    setPage(1);
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row) {
    const confirmed = await confirm({
      title: "Supprimer cette ligne",
      description: "Cette action est irreversible.",
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    const primaryKeyColumns = schema.filter((column) => column.key === "PRI");
    const primaryKey = {};
    (primaryKeyColumns.length ? primaryKeyColumns : schema.slice(0, 1)).forEach((column) => {
      primaryKey[column.column] = row[column.column];
    });
    try {
      await axios.delete("/api/database/row", { data: { id: connectionId, table, primaryKey } });
      notify("Ligne supprimee", "success");
      load();
    } catch (error) {
      notify(error?.response?.data?.error || error.message, "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-base-800 bg-base-900/60 px-5 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-md border border-base-700 bg-base-900 py-1.5 pl-8 pr-3 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
          />
        </div>
        <button
          onClick={() => setModalRow(null)}
          className="flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-transform hover:scale-[1.02] hover:bg-accent/20 active:scale-[0.98]"
        >
          <Plus size={13} /> Ajouter une ligne
        </button>
        <div className="ml-auto text-xs text-base-500">
          {total} lignes - {formatDuration(durationMs)}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader label="Chargement des donnees..." />
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-base-900">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="border-b border-base-800 px-4 py-2 text-left text-xs font-medium text-base-400">
                    {column}
                  </th>
                ))}
                <th className="border-b border-base-800 px-4 py-2 text-right text-xs font-medium text-base-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="transition-colors hover:bg-base-800/40">
                  {columns.map((column) => (
                    <td key={column} className="border-b border-base-800/60 px-4 py-2 text-base-300 whitespace-nowrap">
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
                  <td className="border-b border-base-800/60 px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setModalRow(row)} className="text-base-500 hover:text-accent">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(row)} className="text-base-500 hover:text-signal-rose">
                        <Trash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-14 text-center text-xs text-base-500">
                    <div className="flex flex-col items-center gap-2">
                      <Table2 size={20} className="text-base-700" />
                      Aucune donnee
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-base-800 px-5 py-3 text-xs text-base-400">
        <span>
          Page {page} sur {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-md border border-base-700 p-1.5 disabled:opacity-40"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-base-700 p-1.5 disabled:opacity-40"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {previewBlob && (
        <BlobPreviewModal
          blob={previewBlob.blob}
          columnName={previewBlob.columnName}
          onClose={() => setPreviewBlob(null)}
        />
      )}

      {modalRow !== undefined && (
        <RowModal
          connectionId={connectionId}
          table={table}
          columns={schema}
          row={modalRow}
          onClose={() => setModalRow(undefined)}
          onSaved={() => {
            setModalRow(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}
