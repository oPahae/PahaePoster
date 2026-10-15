import { makeId } from "./classDiagramSyntax";

const TYPE_PATTERNS = [
  [/^(varchar|char|nvarchar|nchar|text|longtext|mediumtext|tinytext|enum|uuid|json|jsonb)/i, "string"],
  [/^(bigint|serial|bigserial)/i, "long"],
  [/^(int|integer|smallint|mediumint|tinyint)/i, "int"],
  [/^(decimal|numeric|money)/i, "decimal"],
  [/^(float|real)/i, "float"],
  [/^(double)/i, "double"],
  [/^(bool|boolean|bit)/i, "boolean"],
  [/^(datetime|timestamp)/i, "datetime"],
  [/^(date)/i, "date"]
];

function mapType(rawType) {
  const cleaned = String(rawType || "").trim();
  for (let i = 0; i < TYPE_PATTERNS.length; i += 1) {
    if (TYPE_PATTERNS[i][0].test(cleaned)) return TYPE_PATTERNS[i][1];
  }
  return "string";
}

function stripQuotes(name) {
  return String(name || "")
    .trim()
    .replace(/^[`"[]|[`"\]]$/g, "")
    .trim();
}

function stripComments(sql) {
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  let inString = null;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      current += char;
      if (char === inString) inString = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      inString = char;
      current += char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function findCreateTableBlocks(sql) {
  const blocks = [];
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"[\]\w.]+)\s*\(/gi;
  let match = regex.exec(sql);
  while (match) {
    const startParen = match.index + match[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let i = startParen; i < sql.length; i += 1) {
      if (sql[i] === "(") depth += 1;
      else if (sql[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const rawName = match[1].split(".").pop();
      blocks.push({ name: stripQuotes(rawName), body: sql.slice(startParen + 1, end) });
    }
    match = regex.exec(sql);
  }
  return blocks;
}

function extractInlineReference(clause) {
  const match = clause.match(/REFERENCES\s+([`"[\]\w.]+)\s*\(([^)]+)\)/i);
  if (!match) return null;
  const refTable = stripQuotes(match[1].split(".").pop());
  const refColumn = stripQuotes(match[2].split(",")[0]);
  return { refTable, refColumn };
}

function capitalize(text) {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

function buildGetter(attribute) {
  const prefix = ["boolean", "bool"].includes((attribute.type || "").toLowerCase()) ? "is" : "get";
  return { id: makeId(), visibility: "+", name: `${prefix}${capitalize(attribute.name)}`, params: "", type: attribute.type };
}

function parseTableBody(tableName, body) {
  const clauses = splitTopLevel(body);
  const columns = [];
  const primaryKeys = new Set();
  const foreignKeys = [];

  clauses.forEach((rawClause) => {
    const clause = rawClause.trim();
    const upper = clause.toUpperCase();

    if (upper.startsWith("PRIMARY KEY")) {
      const match = clause.match(/\(([^)]+)\)/);
      if (match) {
        match[1].split(",").forEach((col) => primaryKeys.add(stripQuotes(col)));
      }
      return;
    }

    if (upper.startsWith("FOREIGN KEY") || (upper.startsWith("CONSTRAINT") && upper.includes("FOREIGN KEY"))) {
      const match = clause.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"[\]\w.]+)\s*\(([^)]+)\)/i);
      if (match) {
        foreignKeys.push({
          column: stripQuotes(match[1].split(",")[0]),
          refTable: stripQuotes(match[2].split(".").pop()),
          refColumn: stripQuotes(match[3].split(",")[0])
        });
      }
      return;
    }

    if (upper.startsWith("UNIQUE") || upper.startsWith("KEY") || upper.startsWith("INDEX") || upper.startsWith("CHECK") || upper.startsWith("CONSTRAINT")) {
      return;
    }

    const tokens = clause.split(/\s+/).filter(Boolean);
    if (tokens.length < 1) return;
    const columnName = stripQuotes(tokens[0]);
    if (!columnName) return;
    const typeToken = tokens[1] || "varchar";
    const type = mapType(typeToken);
    const isPrimary = /PRIMARY\s+KEY/i.test(clause);
    if (isPrimary) primaryKeys.add(columnName);

    const reference = extractInlineReference(clause);
    if (reference) {
      foreignKeys.push({ column: columnName, refTable: reference.refTable, refColumn: reference.refColumn });
    }

    columns.push({ name: columnName, type });
  });

  const attributes = columns.map((column) => ({
    id: makeId(),
    visibility: primaryKeys.has(column.name) ? "+" : "-",
    name: column.name,
    type: column.type
  }));

  const methods = attributes.filter((attribute) => attribute.visibility === "-").map(buildGetter);
  methods.push({ id: makeId(), visibility: "+", name: "", type: "" });
  attributes.push({ id: makeId(), visibility: "-", name: "", type: "" });

  return { name: tableName, attributes, methods, foreignKeys };
}

export function parseSqlToDiagram(sqlText) {
  const cleaned = stripComments(String(sqlText || ""));
  const blocks = findCreateTableBlocks(cleaned);

  const classes = [];
  const foreignKeysByTable = {};

  blocks.forEach((block, index) => {
    const parsed = parseTableBody(block.name, block.body);
    const classItem = {
      id: makeId(),
      name: parsed.name,
      x: 80 + (index % 4) * 280,
      y: 80 + Math.floor(index / 4) * 260,
      attributes: parsed.attributes,
      methods: parsed.methods
    };
    classes.push(classItem);
    foreignKeysByTable[classItem.id] = parsed.foreignKeys;
  });

  const relations = [];
  classes.forEach((classItem) => {
    (foreignKeysByTable[classItem.id] || []).forEach((fk) => {
      const target = classes.find((item) => item.name.toLowerCase() === fk.refTable.toLowerCase());
      if (!target || target.id === classItem.id) return;
      relations.push({
        id: makeId(),
        fromId: classItem.id,
        toId: target.id,
        type: "association",
        fromCardinality: "0..*",
        toCardinality: "1"
      });
    });
  });

  return { classes, relations };
}
