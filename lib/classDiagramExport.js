import { CLASS_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, rectAnchor } from "./classDiagramLayout";

function readThemeColor(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw.split(/\s+/).join(",")})` : fallback;
}

function escapeXml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const RELATION_MARKERS = {
  association: "url(#arrow-open)",
  dependency: "url(#arrow-open)",
  inheritance: "url(#triangle-hollow)",
  realization: "url(#triangle-hollow)",
  aggregation: "none",
  composition: "none"
};

const RELATION_DASH = {
  dependency: "4 4",
  realization: "4 4"
};

export function buildDiagramSvg(classes, relations) {
  const colors = {
    bg: readThemeColor("--base-950", "#000000"),
    card: readThemeColor("--base-900", "#09090b"),
    header: readThemeColor("--base-800", "#18181b"),
    border: readThemeColor("--base-700", "#27272a"),
    text: readThemeColor("--base-300", "#d4d4d8"),
    textMuted: readThemeColor("--base-500", "#71717a"),
    accent: readThemeColor("--accent", "#38bdf8"),
    blue: readThemeColor("--signal-blue", "#818cf8"),
    line: readThemeColor("--base-400", "#a1a1aa")
  };

  const cleanClasses = classes.map((item) => ({
    ...item,
    attributes: item.attributes.filter((attribute) => attribute.name.trim()),
    methods: item.methods.filter((method) => method.name.trim())
  }));

  const boxes = {};
  cleanClasses.forEach((item) => {
    const height = HEADER_HEIGHT + Math.max(item.attributes.length, 1) * ROW_HEIGHT + Math.max(item.methods.length, 1) * ROW_HEIGHT + 16;
    boxes[item.id] = { x: item.x, y: item.y, width: CLASS_WIDTH, height };
  });

  const maxX = cleanClasses.length ? Math.max(...cleanClasses.map((item) => boxes[item.id].x + boxes[item.id].width)) : 400;
  const maxY = cleanClasses.length ? Math.max(...cleanClasses.map((item) => boxes[item.id].y + boxes[item.id].height)) : 300;
  const width = maxX + 60;
  const height = maxY + 60;

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<rect width="${width}" height="${height}" fill="${colors.bg}" />`);
  parts.push(
    `<defs><marker id="arrow-open" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="${colors.line}" stroke-width="1.4" /></marker><marker id="triangle-hollow" markerWidth="14" markerHeight="12" refX="12" refY="5" orient="auto"><path d="M0,0 L12,5 L0,10 Z" fill="${colors.card}" stroke="${colors.text}" stroke-width="1.2" /></marker></defs>`
  );

  relations.forEach((relation) => {
    const fromBox = boxes[relation.fromId];
    const toBox = boxes[relation.toId];
    if (!fromBox || !toBox) return;
    const fromCenter = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
    const toCenter = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };
    const start = rectAnchor(fromBox, toCenter.x, toCenter.y);
    const end = rectAnchor(toBox, fromCenter.x, fromCenter.y);
    const marker = RELATION_MARKERS[relation.type] || "none";
    const dash = RELATION_DASH[relation.type] || "none";
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const diamondSize = 9;

    parts.push(
      `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${colors.line}" stroke-width="1.4" ${
        dash !== "none" ? `stroke-dasharray="${dash}"` : ""
      } ${marker !== "none" ? `marker-end="${marker}"` : ""} />`
    );

    if (relation.type === "aggregation" || relation.type === "composition") {
      const points = [
        [start.x, start.y],
        [start.x + Math.cos(angle - 0.5) * diamondSize * 1.6, start.y + Math.sin(angle - 0.5) * diamondSize * 1.6],
        [start.x + Math.cos(angle) * diamondSize * 3, start.y + Math.sin(angle) * diamondSize * 3],
        [start.x + Math.cos(angle + 0.5) * diamondSize * 1.6, start.y + Math.sin(angle + 0.5) * diamondSize * 1.6]
      ]
        .map((point) => point.join(","))
        .join(" ");
      const fill = relation.type === "composition" ? colors.text : colors.card;
      parts.push(`<polygon points="${points}" fill="${fill}" stroke="${colors.text}" stroke-width="1.2" />`);
    }

    parts.push(
      `<text x="${start.x + (end.x - start.x) * 0.15}" y="${start.y + (end.y - start.y) * 0.15 - 6}" font-size="10" fill="${colors.textMuted}" font-family="monospace">${escapeXml(relation.fromCardinality)}</text>`
    );
    parts.push(
      `<text x="${start.x + (end.x - start.x) * 0.85}" y="${start.y + (end.y - start.y) * 0.85 - 6}" font-size="10" fill="${colors.textMuted}" font-family="monospace">${escapeXml(relation.toCardinality)}</text>`
    );
  });

  cleanClasses.forEach((item) => {
    const box = boxes[item.id];
    parts.push(`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="8" fill="${colors.card}" stroke="${colors.border}" />`);
    parts.push(`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${HEADER_HEIGHT}" rx="8" fill="${colors.header}" />`);
    parts.push(
      `<text x="${box.x + box.width / 2}" y="${box.y + 21}" text-anchor="middle" font-size="12" font-weight="600" font-family="monospace" fill="${colors.accent}">${escapeXml(item.name)}</text>`
    );

    const attributeRows = item.attributes.length ? item.attributes : [{ visibility: "", name: "(aucun attribut)", type: "" }];
    attributeRows.forEach((attribute, index) => {
      const y = box.y + HEADER_HEIGHT + index * ROW_HEIGHT + 14;
      const label = attribute.type ? `${attribute.visibility} ${attribute.name} : ${attribute.type}` : attribute.name;
      parts.push(`<text x="${box.x + 12}" y="${y}" font-size="10.5" font-family="monospace" fill="${colors.text}">${escapeXml(label)}</text>`);
    });

    const methodsY = box.y + HEADER_HEIGHT + Math.max(item.attributes.length, 1) * ROW_HEIGHT;
    parts.push(`<line x1="${box.x}" y1="${methodsY}" x2="${box.x + box.width}" y2="${methodsY}" stroke="${colors.border}" />`);

    const methodRows = item.methods.length ? item.methods : [{ visibility: "", name: "(aucune methode)", type: "" }];
    methodRows.forEach((method, index) => {
      const y = methodsY + index * ROW_HEIGHT + 14;
      const label = method.type ? `${method.visibility} ${method.name}() : ${method.type}` : method.name;
      parts.push(`<text x="${box.x + 12}" y="${y}" font-size="10.5" font-family="monospace" fill="${colors.blue}">${escapeXml(label)}</text>`);
    });
  });

  parts.push("</svg>");
  return { svg: parts.join(""), width, height };
}

export function downloadDiagramPng(classes, relations, fileName) {
  const { svg, width, height } = buildDiagramSvg(classes, relations);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  image.src = url;
}
