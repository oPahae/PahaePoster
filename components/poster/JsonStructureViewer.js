import { inferJsonStructure } from "../../lib/utils";

function renderNode(node, depth = 0) {
  if (Array.isArray(node)) {
    return (
      <div style={{ paddingLeft: depth * 16 }}>
        <span className="text-base-400">array</span>
        {node.length > 0 && renderNode(node[0], depth + 1)}
      </div>
    );
  }
  if (node && typeof node === "object") {
    return (
      <div style={{ paddingLeft: depth * 16 }}>
        {Object.entries(node).map(([key, value]) => (
          <div key={key}>
            <span className="text-base-200">{key}</span>
            {typeof value === "object" && value !== null ? (
              renderNode(value, depth + 1)
            ) : (
              <span className="text-accent">: {value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-accent">: {node}</span>;
}

export default function JsonStructureViewer({ data }) {
  if (data === undefined || data === null) {
    return <div className="flex h-full items-center justify-center text-sm text-base-500">Aucune structure disponible</div>;
  }
  const structure = inferJsonStructure(data);
  return <div className="p-4 font-mono text-xs leading-6">{renderNode(structure)}</div>;
}
