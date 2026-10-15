import { useEffect, useRef, useState } from "react";
import { Trash, Link2 } from "lucide-react";
import { COMMON_ATTRIBUTE_NAMES, COMMON_TYPES } from "../../lib/classHeuristics";
import { makeId } from "../../lib/classDiagramSyntax";
import EditableRows from "./EditableRows";
import { CLASS_WIDTH } from "../../lib/classDiagramLayout";

function capitalize(text) {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

export default function ClassBox({ classItem, otherClassNames, onUpdate, onDelete, onMeasure, onMove, onStartLink, selected, onSelect, zoom }) {
  const boxRef = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(classItem.name);
  const dragState = useRef(null);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !boxRef.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) onMeasure(classItem.id, { width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [classItem.id, onMeasure]);

  function startDrag(event) {
    if (event.button !== 0) return;
    onSelect(classItem.id);
    dragState.current = { startX: event.clientX, startY: event.clientY, originX: classItem.x, originY: classItem.y };
    function handleMove(moveEvent) {
      if (!dragState.current) return;
      const scale = zoom || 1;
      const dx = (moveEvent.clientX - dragState.current.startX) / scale;
      const dy = (moveEvent.clientY - dragState.current.startY) / scale;
      onMove(classItem.id, dragState.current.originX + dx, dragState.current.originY + dy);
    }
    function handleUp() {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function commitRename() {
    setRenaming(false);
    if (nameDraft.trim()) onUpdate({ ...classItem, name: nameDraft.trim() });
    else setNameDraft(classItem.name);
  }

  function handleAttributesChange(rows) {
    onUpdate({ ...classItem, attributes: rows });
  }

  function handleMethodsChange(rows) {
    onUpdate({ ...classItem, methods: rows });
  }

  function handleAttributeCommit(row) {
    if (row.visibility !== "-") return;
    const getterPrefix = ["boolean", "bool"].includes((row.type || "").toLowerCase()) ? "is" : "get";
    const getterName = `${getterPrefix}${capitalize(row.name)}`;
    const alreadyExists = classItem.methods.some((method) => method.name === getterName);
    if (alreadyExists) return;
    const getter = { id: makeId(), visibility: "+", name: getterName, params: "", type: row.type || "string" };
    const withoutTrailingEmpty = classItem.methods.filter((method) => method.name.trim() !== "");
    const nextMethods = [...withoutTrailingEmpty, getter, { id: makeId(), visibility: "+", name: "", type: "" }];
    onUpdate({ ...classItem, methods: nextMethods });
  }

  const typeSuggestions = [...COMMON_TYPES, ...otherClassNames];

  return (
    <div
      ref={boxRef}
      onPointerDown={() => onSelect(classItem.id)}
      style={{ position: "absolute", left: classItem.x, top: classItem.y, width: CLASS_WIDTH }}
      className={`select-none overflow-hidden rounded-lg border bg-base-900 shadow-card transition-shadow duration-150 ${selected ? "border-accent shadow-glow-sm" : "border-base-700"}`}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab items-center gap-1 border-b border-base-700 bg-gradient-to-b from-base-800 to-base-850 px-2 py-1.5 active:cursor-grabbing"
      >
        {renaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => event.key === "Enter" && commitRename()}
            className="min-w-0 flex-1 bg-transparent text-center text-xs font-semibold text-base-100 outline-none"
          />
        ) : (
          <p
            onDoubleClick={() => setRenaming(true)}
            className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-base-100"
          >
            {classItem.name}
          </p>
        )}
        <button
          onPointerDown={(event) => {
            event.stopPropagation();
            onStartLink(classItem.id, event.clientX, event.clientY);
          }}
          title="Relier a une autre classe"
          className="shrink-0 text-base-500 hover:text-accent"
        >
          <Link2 size={12} />
        </button>
        <button onClick={() => onDelete(classItem.id)} className="shrink-0 text-base-500 hover:text-signal-rose">
          <Trash size={12} />
        </button>
      </div>

      <div className="border-b border-base-700 py-1">
        <EditableRows
          rows={classItem.attributes}
          onChange={handleAttributesChange}
          isMethod={false}
          nameSuggestions={COMMON_ATTRIBUTE_NAMES}
          typeSuggestions={typeSuggestions}
          onCommitRow={handleAttributeCommit}
        />
      </div>
      <div className="py-1">
        <EditableRows
          rows={classItem.methods}
          onChange={handleMethodsChange}
          isMethod
          nameSuggestions={[]}
          typeSuggestions={typeSuggestions}
        />
      </div>
    </div>
  );
}
