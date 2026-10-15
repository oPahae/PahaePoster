export const CLASS_WIDTH = 240;
export const HEADER_HEIGHT = 34;
export const ROW_HEIGHT = 20;
export const SECTION_LABEL_HEIGHT = 18;

export function estimateClassHeight(classItem) {
  const attrRows = Math.max(classItem.attributes.length, 1);
  const methodRows = Math.max(classItem.methods.length, 1);
  return HEADER_HEIGHT + SECTION_LABEL_HEIGHT + attrRows * ROW_HEIGHT + SECTION_LABEL_HEIGHT + methodRows * ROW_HEIGHT + 16;
}

export function rectAnchor(box, towardX, towardY) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = box.width / 2;
  const halfH = box.height / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function autoArrange(classes, sizes, relations) {
  const nodes = classes.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    width: (sizes[item.id] && sizes[item.id].width) || CLASS_WIDTH,
    height: (sizes[item.id] && sizes[item.id].height) || estimateClassHeight(item),
    vx: 0,
    vy: 0
  }));
  if (nodes.length === 0) return {};

  const indexOf = new Map(nodes.map((node, index) => [node.id, index]));
  const edges = relations
    .map((relation) => [indexOf.get(relation.fromId), indexOf.get(relation.toId)])
    .filter(([a, b]) => a !== undefined && b !== undefined && a !== b);

  const iterations = 500;
  const idealLength = 300;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const ax = a.x + a.width / 2;
        const ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2;
        const by = b.y + b.height / 2;
        let dx = ax - bx;
        let dy = ay - by;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          distance = 1;
        }
        const minSeparation = (a.width + b.width) / 2 + (a.height + b.height) / 4 + 50;
        if (distance < minSeparation) {
          const force = ((minSeparation - distance) / distance) * 0.5;
          const fx = dx * force;
          const fy = dy * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
    }

    edges.forEach(([a, b]) => {
      const nodeA = nodes[a];
      const nodeB = nodes[b];
      const ax = nodeA.x + nodeA.width / 2;
      const ay = nodeA.y + nodeA.height / 2;
      const bx = nodeB.x + nodeB.width / 2;
      const by = nodeB.y + nodeB.height / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (distance - idealLength) * 0.02;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      nodeA.vx += fx;
      nodeA.vy += fy;
      nodeB.vx -= fx;
      nodeB.vy -= fy;
    });

    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.82;
      node.vy *= 0.82;
      node.x = Math.max(40, node.x);
      node.y = Math.max(40, node.y);
    });
  }

  const positions = {};
  nodes.forEach((node) => {
    positions[node.id] = { x: Math.round(node.x), y: Math.round(node.y) };
  });
  return positions;
}
