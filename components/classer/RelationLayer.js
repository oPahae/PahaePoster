import { rectAnchor } from "../../lib/classDiagramLayout";

const RELATION_STYLES = {
  association: { dash: "none", marker: "url(#arrow-open)", diamondStart: false },
  dependency: { dash: "4 4", marker: "url(#arrow-open)", diamondStart: false },
  inheritance: { dash: "none", marker: "url(#triangle-hollow)", diamondStart: false },
  realization: { dash: "4 4", marker: "url(#triangle-hollow)", diamondStart: false },
  aggregation: { dash: "none", marker: "none", diamondStart: "hollow" },
  composition: { dash: "none", marker: "none", diamondStart: "filled" }
};

export default function RelationLayer({ boxes, relations, linkDraft, onDeleteRelation, width, height }) {
  function boxFor(id) {
    return boxes[id];
  }

  return (
    <svg
      width={width}
      height={height}
      className="pointer-events-none absolute left-0 top-0"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker id="arrow-open" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8" fill="none" stroke="rgb(var(--base-400))" strokeWidth="1.4" />
        </marker>
        <marker id="triangle-hollow" markerWidth="14" markerHeight="12" refX="12" refY="5" orient="auto">
          <path d="M0,0 L12,5 L0,10 Z" fill="rgb(var(--base-900))" stroke="rgb(var(--base-300))" strokeWidth="1.2" />
        </marker>
      </defs>

      {relations.map((relation) => {
        const fromBox = boxFor(relation.fromId);
        const toBox = boxFor(relation.toId);
        if (!fromBox || !toBox) return null;
        const fromCenter = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
        const toCenter = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };
        const start = rectAnchor(fromBox, toCenter.x, toCenter.y);
        const end = rectAnchor(toBox, fromCenter.x, fromCenter.y);
        const style = RELATION_STYLES[relation.type] || RELATION_STYLES.association;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const diamondSize = 9;
        const diamondPoints = style.diamondStart
          ? [
              [start.x, start.y],
              [start.x + Math.cos(angle - 0.5) * diamondSize * 1.6, start.y + Math.sin(angle - 0.5) * diamondSize * 1.6],
              [start.x + Math.cos(angle) * diamondSize * 3, start.y + Math.sin(angle) * diamondSize * 3],
              [start.x + Math.cos(angle + 0.5) * diamondSize * 1.6, start.y + Math.sin(angle + 0.5) * diamondSize * 1.6]
            ]
              .map((point) => point.join(","))
              .join(" ")
          : null;

        return (
          <g key={relation.id} className="pointer-events-auto cursor-pointer" onClick={() => onDeleteRelation(relation.id)}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth="14" />
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="rgb(var(--base-400))"
              strokeWidth="1.4"
              strokeDasharray={style.dash}
              markerEnd={style.marker !== "none" ? style.marker : undefined}
            />
            {diamondPoints && (
              <polygon
                points={diamondPoints}
                fill={style.diamondStart === "filled" ? "rgb(var(--base-300))" : "rgb(var(--base-900))"}
                stroke="rgb(var(--base-300))"
                strokeWidth="1.2"
              />
            )}
            <text x={start.x + (end.x - start.x) * 0.15} y={start.y + (end.y - start.y) * 0.15 - 6} fontSize="10" fill="rgb(var(--base-400))" className="font-mono">
              {relation.fromCardinality}
            </text>
            <text x={start.x + (end.x - start.x) * 0.85} y={start.y + (end.y - start.y) * 0.85 - 6} fontSize="10" fill="rgb(var(--base-400))" className="font-mono">
              {relation.toCardinality}
            </text>
            {relation.type !== "association" && (
              <text x={midX} y={midY - 6} fontSize="9.5" fill="rgb(var(--accent))" textAnchor="middle" className="font-mono italic">
                {relation.type}
              </text>
            )}
          </g>
        );
      })}

      {linkDraft && boxFor(linkDraft.fromId) && (
        <line
          x1={rectAnchor(boxFor(linkDraft.fromId), linkDraft.x, linkDraft.y).x}
          y1={rectAnchor(boxFor(linkDraft.fromId), linkDraft.x, linkDraft.y).y}
          x2={linkDraft.x}
          y2={linkDraft.y}
          stroke="rgb(var(--accent))"
          strokeWidth="1.6"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}
