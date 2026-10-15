import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, LayoutGrid, Sparkles, Database, Download, ZoomIn, ZoomOut, Eraser } from "lucide-react";
import { guessAttributes } from "../../lib/classHeuristics";
import { makeId } from "../../lib/classDiagramSyntax";
import { autoArrange, estimateClassHeight, CLASS_WIDTH } from "../../lib/classDiagramLayout";
import { downloadDiagramPng } from "../../lib/classDiagramExport";
import { useNotification } from "../layout/NotificationContext";
import ClassBox from "./ClassBox";
import RelationLayer from "./RelationLayer";
import RelationModal from "./RelationModal";
import AiGenerateModal from "./AiGenerateModal";
import SqlImportModal from "./SqlImportModal";

const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = 2200;
const STORAGE_KEY = "pahaeposter-classer-diagram";
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

function buildClass(name, offsetIndex) {
  const attributes = guessAttributes(name).map((attr) => ({
    id: makeId(),
    visibility: attr.visibility,
    name: attr.name,
    type: attr.type
  }));
  attributes.push({ id: makeId(), visibility: "-", name: "", type: "" });
  return {
    id: makeId(),
    name,
    x: 80 + (offsetIndex % 4) * 280,
    y: 80 + Math.floor(offsetIndex / 4) * 260,
    attributes,
    methods: [{ id: makeId(), visibility: "+", name: "", type: "" }]
  };
}

export default function ClasserModule() {
  const { confirm, notify } = useNotification();
  const [classes, setClasses] = useState([]);
  const [relations, setRelations] = useState([]);
  const [sizes, setSizes] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [linkDraft, setLinkDraft] = useState(null);
  const [pendingLink, setPendingLink] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setClasses(parsed.classes || []);
        setRelations(parsed.relations || []);
      }
    } catch (error) {
      setClasses([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ classes, relations }));
  }, [classes, relations, loaded]);

  const handleMeasure = useCallback((id, size) => {
    setSizes((current) => ({ ...current, [id]: size }));
  }, []);

  function toCanvasPoint(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left + canvasRef.current.scrollLeft) / zoom,
      y: (clientY - rect.top + canvasRef.current.scrollTop) / zoom
    };
  }

  function handleAddClass() {
    const name = newClassName.trim();
    if (!name) return;
    const newClass = buildClass(name, classes.length);
    setClasses((current) => [...current, newClass]);
    setSelectedId(newClass.id);
    setNewClassName("");
  }

  function handleUpdateClass(next) {
    setClasses((current) => current.map((item) => (item.id === next.id ? next : item)));
  }

  async function handleDeleteClass(id) {
    const target = classes.find((item) => item.id === id);
    const confirmed = await confirm({
      title: `Supprimer la classe ${target ? target.name : ""}`,
      description: "Les relations liees a cette classe seront aussi supprimees.",
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    setClasses((current) => current.filter((item) => item.id !== id));
    setRelations((current) => current.filter((relation) => relation.fromId !== id && relation.toId !== id));
  }

  function handleMoveClass(id, x, y) {
    setClasses((current) => current.map((item) => (item.id === id ? { ...item, x, y } : item)));
  }

  function handleStartLink(fromId, clientX, clientY) {
    const point = toCanvasPoint(clientX, clientY);
    setLinkDraft({ fromId, x: point.x, y: point.y });

    function handleMove(event) {
      const nextPoint = toCanvasPoint(event.clientX, event.clientY);
      setLinkDraft((current) => (current ? { ...current, x: nextPoint.x, y: nextPoint.y } : current));
    }

    function handleUp(event) {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const classElement = target ? target.closest("[data-class-id]") : null;
      setLinkDraft(null);
      if (classElement) {
        const toId = classElement.getAttribute("data-class-id");
        if (toId && toId !== fromId) {
          setPendingLink({ fromId, toId });
        }
      }
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function handleConfirmRelation(details) {
    if (!pendingLink) return;
    setRelations((current) => [
      ...current,
      {
        id: makeId(),
        fromId: pendingLink.fromId,
        toId: pendingLink.toId,
        type: details.type,
        fromCardinality: details.fromCardinality,
        toCardinality: details.toCardinality
      }
    ]);
    setPendingLink(null);
  }

  async function handleDeleteRelation(id) {
    const confirmed = await confirm({
      title: "Supprimer cette relation",
      confirmLabel: "Supprimer",
      danger: true
    });
    if (!confirmed) return;
    setRelations((current) => current.filter((relation) => relation.id !== id));
  }

  function handleAutoArrange() {
    const positions = autoArrange(classes, sizes, relations);
    setClasses((current) => current.map((item) => (positions[item.id] ? { ...item, ...positions[item.id] } : item)));
  }

  function handleGenerated({ classes: newClasses, relations: newRelations }) {
    setClasses((current) => {
      const merged = [...current, ...newClasses];
      const positions = autoArrange(merged, sizes, [...relations, ...newRelations]);
      return merged.map((item) => (positions[item.id] ? { ...item, ...positions[item.id] } : item));
    });
    setRelations((current) => [...current, ...newRelations]);
  }

  function handleZoomIn() {
    setZoom((current) => Math.min(ZOOM_MAX, Math.round((current + ZOOM_STEP) * 100) / 100));
  }

  function handleZoomOut() {
    setZoom((current) => Math.max(ZOOM_MIN, Math.round((current - ZOOM_STEP) * 100) / 100));
  }

  function handleZoomReset() {
    setZoom(1);
  }

  function handleDownload() {
    if (classes.length === 0) {
      notify("Aucune classe a exporter", "error");
      return;
    }
    downloadDiagramPng(classes, relations, "diagramme-classes-pahaeposter.png");
  }

  async function handleClearDiagram() {
    if (classes.length === 0 && relations.length === 0) return;
    const confirmed = await confirm({
      title: "Vider le diagramme",
      description: "Toutes les classes et relations seront definitivement supprimees.",
      confirmLabel: "Vider",
      danger: true
    });
    if (!confirmed) return;
    setClasses([]);
    setRelations([]);
    setSelectedId(null);
  }

  const boxes = {};
  classes.forEach((item) => {
    const size = sizes[item.id] || { width: CLASS_WIDTH, height: estimateClassHeight(item) };
    boxes[item.id] = { x: item.x, y: item.y, width: size.width, height: size.height };
  });

  const pendingFromClass = pendingLink ? classes.find((item) => item.id === pendingLink.fromId) : null;
  const pendingToClass = pendingLink ? classes.find((item) => item.id === pendingLink.toId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-base-800 bg-base-900/60 px-5 py-3">
        <div className="relative flex-1 max-w-xs">
          <input
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleAddClass()}
            placeholder="Nom de la classe puis Entree"
            className="w-full rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-base-100 outline-none transition-shadow focus:border-accent focus:shadow-glow-sm"
          />
        </div>
        <button
          onClick={handleAddClass}
          className="flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-transform hover:scale-[1.02] hover:bg-accent/20 active:scale-[0.98]"
        >
          <Plus size={13} /> Ajouter
        </button>
        <button
          onClick={handleAutoArrange}
          className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
        >
          <LayoutGrid size={13} /> Organiser
        </button>
        <button
          onClick={() => setShowSqlModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
        >
          <Database size={13} /> Importer du SQL
        </button>
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-accent/20 to-accent-strong/10 px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/30 transition-transform hover:scale-[1.02] hover:shadow-glow-sm active:scale-[0.98]"
        >
          <Sparkles size={13} /> Generer avec l'IA
        </button>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-md border border-base-700 px-1 py-1">
            <button onClick={handleZoomOut} className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-accent">
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleZoomReset}
              className="w-11 text-center font-mono text-[11px] text-base-400 hover:text-accent"
              title="Reinitialiser le zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={handleZoomIn} className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-accent">
              <ZoomIn size={14} />
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-md border border-base-700 px-3 py-1.5 text-xs text-base-300 transition-transform hover:scale-[1.02] hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            <Download size={13} /> Telecharger
          </button>
          <button
            onClick={handleClearDiagram}
            className="flex items-center gap-1.5 rounded-md border border-signal-rose/40 px-3 py-1.5 text-xs text-signal-rose hover:bg-signal-rose/10"
          >
            <Eraser size={13} /> Vider
          </button>
        </div>
      </div>

      <div ref={canvasRef} className="relative flex-1 overflow-auto bg-base-950">
        <div style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom, position: "relative" }}>
          <div
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, position: "relative", transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
          >
            <RelationLayer
              boxes={boxes}
              relations={relations}
              linkDraft={linkDraft}
              onDeleteRelation={handleDeleteRelation}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
            {classes.map((item) => (
              <div key={item.id} data-class-id={item.id}>
                <ClassBox
                  classItem={item}
                  otherClassNames={classes.filter((other) => other.id !== item.id).map((other) => other.name)}
                  onUpdate={handleUpdateClass}
                  onDelete={handleDeleteClass}
                  onMeasure={handleMeasure}
                  onMove={handleMoveClass}
                  onStartLink={handleStartLink}
                  selected={selectedId === item.id}
                  onSelect={setSelectedId}
                  zoom={zoom}
                />
              </div>
            ))}
            {classes.length === 0 && (
              <div className="absolute left-16 top-16 max-w-sm text-sm text-base-500">
                Tape un nom de classe ci-dessus (ex: "utilisateur", "produit", "commande") et appuie sur Entree, ou
                importe un schema existant via "Importer du SQL" ou "Generer avec l'IA".
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingLink && pendingFromClass && pendingToClass && (
        <RelationModal
          fromName={pendingFromClass.name}
          toName={pendingToClass.name}
          onConfirm={handleConfirmRelation}
          onCancel={() => setPendingLink(null)}
        />
      )}

      {showAiModal && <AiGenerateModal onClose={() => setShowAiModal(false)} onGenerated={handleGenerated} />}

      {showSqlModal && <SqlImportModal onClose={() => setShowSqlModal(false)} onGenerated={handleGenerated} />}
    </div>
  );
}
