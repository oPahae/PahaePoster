import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Download, X, KeyRound, Link2 } from "lucide-react";
import { useNotification } from "../layout/NotificationContext";
import { downloadImageAsPdf } from "../../lib/pdfExport";
import Loader from "../layout/Loader";

const COLUMN_HEIGHT = 20;
const HEADER_HEIGHT = 32;
const CARD_WIDTH = 220;
const GAP_X = 60;
const COLUMNS_PER_ROW = 3;

function readThemeColor(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw.split(/\s+/).join(",")})` : fallback;
}

function resolveSvgColors(svgString) {
  return svgString.replace(/rgb\(var\((--[\w-]+)\)\)/g, (match, varName) => readThemeColor(varName, match));
}

export default function ErdViewer({ connectionId, onClose }) {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [relations, setRelations] = useState([]);
  const [positions, setPositions] = useState({});
  const svgRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    axios
      .post("/api/database/erd", { id: connectionId })
      .then(({ data }) => {
        const nextTables = data.tables || [];
        setTables(nextTables);
        setRelations(data.relations || []);
        const initialPositions = {};
        nextTables.forEach((table, index) => {
          const col = index % COLUMNS_PER_ROW;
          const row = Math.floor(index / COLUMNS_PER_ROW);
          initialPositions[table.name] = {
            x: 40 + col * (CARD_WIDTH + GAP_X),
            y: 40 + row * 260,
            height: HEADER_HEIGHT + table.columns.length * COLUMN_HEIGHT + 12
          };
        });
        setPositions(initialPositions);
      })
      .catch((error) => notify(error?.response?.data?.error || error.message, "error"))
      .finally(() => setLoading(false));
  }, [connectionId, notify]);

  const width = Math.max(40 + COLUMNS_PER_ROW * (CARD_WIDTH + GAP_X) + 400, 2000);
  const height = Math.max(
    tables.length ? 40 + (Math.floor((tables.length - 1) / COLUMNS_PER_ROW) + 1) * 260 + 260 : 300,
    1400
  );

  function columnCenter(tableName, columnName, side) {
    const position = positions[tableName];
    const table = tables.find((item) => item.name === tableName);
    if (!position || !table) return { x: 0, y: 0 };
    const columnIndex = table.columns.findIndex((column) => column.column === columnName);
    const y = position.y + HEADER_HEIGHT + Math.max(columnIndex, 0) * COLUMN_HEIGHT + COLUMN_HEIGHT / 2;
    const x = side === "left" ? position.x : position.x + CARD_WIDTH;
    return { x, y };
  }

  function startDrag(tableName, event) {
    const position = positions[tableName];
    if (!position) return;
    dragState.current = { tableName, startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y };

    function handleMove(moveEvent) {
      if (!dragState.current) return;
      const { tableName: draggedTable, startX, startY, originX, originY } = dragState.current;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPositions((current) => ({
        ...current,
        [draggedTable]: {
          ...current[draggedTable],
          x: originX + dx,
          y: originY + dy
        }
      }));
    }

    function handleUp() {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  async function exportAs(format) {
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = resolveSvgColors(serializer.serializeToString(svg));
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext("2d");
      context.fillStyle = readThemeColor("--base-950", "#000000");
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(2, 2);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      if (format === "png") {
        const link = document.createElement("a");
        link.download = "mpd-pahaeposter.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const jpegUrl = canvas.toDataURL("image/jpeg", 0.92);
        downloadImageAsPdf(jpegUrl, canvas.width, canvas.height, "mpd-pahaeposter.pdf");
      }
    };
    image.src = url;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-6xl flex-col animate-scale-in rounded-xl border border-base-700 bg-base-900 shadow-modal">
        <div className="flex items-center justify-between border-b border-base-800 bg-base-900/60 px-5 py-3">
          <h3 className="text-sm font-semibold text-base-100">Modele physique de donnees</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAs("png")}
              className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              <Download size={13} /> PNG
            </button>
            <button
              onClick={() => exportAs("pdf")}
              className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              <Download size={13} /> PDF
            </button>
            <button onClick={onClose} className="text-base-500 hover:text-base-200">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-base-950 p-4">
          {loading ? (
            <Loader label="Generation du modele..." />
          ) : (
            <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
              <rect width={width} height={height} fill="rgb(var(--base-950))" />
              {relations.map((relation, index) => {
                const from = columnCenter(relation.tableName, relation.columnName, "right");
                const to = columnCenter(relation.refTable, relation.refColumn, "left");
                const midX = (from.x + to.x) / 2;
                return (
                  <path
                    key={index}
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    stroke="rgb(var(--accent))"
                    strokeWidth="1.4"
                    fill="none"
                    opacity="0.6"
                  />
                );
              })}
              {tables.map((table) => {
                const position = positions[table.name];
                if (!position) return null;
                return (
                  <g key={table.name}>
                    <rect
                      x={position.x}
                      y={position.y}
                      width={CARD_WIDTH}
                      height={position.height}
                      rx="8"
                      fill="rgb(var(--base-900))"
                      stroke="rgb(var(--base-700))"
                    />
                    <rect
                      x={position.x}
                      y={position.y}
                      width={CARD_WIDTH}
                      height={HEADER_HEIGHT}
                      rx="8"
                      fill="rgb(var(--base-800))"
                      style={{ cursor: "grab" }}
                      onPointerDown={(event) => startDrag(table.name, event)}
                    />
                    <text
                      x={position.x + 12}
                      y={position.y + 21}
                      fill="rgb(var(--accent))"
                      fontSize="12"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {table.name}
                    </text>
                    {table.columns.map((column, columnIndex) => (
                      <g key={column.column}>
                        <text
                          x={position.x + 14}
                          y={position.y + HEADER_HEIGHT + columnIndex * COLUMN_HEIGHT + 14}
                          fill={column.key === "PRI" ? "rgb(var(--signal-amber))" : "rgb(var(--base-300))"}
                          fontSize="10.5"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {column.column}
                        </text>
                        <text
                          x={position.x + CARD_WIDTH - 10}
                          y={position.y + HEADER_HEIGHT + columnIndex * COLUMN_HEIGHT + 14}
                          fill="rgb(var(--base-400))"
                          fontSize="9.5"
                          textAnchor="end"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {column.type}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-base-800 px-5 py-2 text-[11px] text-base-500">
          <span className="flex items-center gap-1">
            <KeyRound size={11} className="text-signal-amber" /> Cle primaire
          </span>
          <span className="flex items-center gap-1">
            <Link2 size={11} className="text-accent" /> Relation
          </span>
          <span className="ml-auto">Glisse l'en-tete d'une table pour la deplacer</span>
        </div>
      </div>
    </div>
  );
}
