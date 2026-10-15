function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const RELATION_TYPES = ["association", "aggregation", "composition", "inheritance", "dependency", "realization"];

function normalizeRelationType(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (["heritage", "inheritance", "extends"].includes(value)) return "inheritance";
  if (["agregation", "aggregation"].includes(value)) return "aggregation";
  if (["composition"].includes(value)) return "composition";
  if (["dependance", "dependency"].includes(value)) return "dependency";
  if (["realisation", "realization", "implements"].includes(value)) return "realization";
  if (RELATION_TYPES.includes(value)) return value;
  return "association";
}

export const AI_SYNTAX_PROMPT = [
  "Tu es un generateur de diagrammes de classes UML.",
  "A partir du contexte fourni par l'utilisateur, genere un diagramme de classes.",
  "Reponds UNIQUEMENT avec le texte au format suivant, sans aucune explication, sans markdown, sans phrase d'introduction:",
  "",
  "#CLASS: NomDeLaClasse",
  "-attributPrive:type",
  "+attributPublic:type",
  "+nomMethode():typeDeRetour",
  "",
  "#CLASS: AutreClasse",
  "-attribut:type",
  "",
  "#RELATION: ClasseA|ClasseB|type|cardinaliteA|cardinaliteB",
  "",
  "Regles strictes:",
  "- Chaque classe commence par une ligne '#CLASS: Nom' suivie des lignes d'attributs puis de methodes.",
  "- Les attributs commencent par '-' (prive), '+' (public) ou '#' (protege), suivis de 'nom:type'.",
  "- Les methodes suivent le meme prefixe de visibilite et contiennent des parentheses: 'nom():typeDeRetour'.",
  "- Types autorises: string, int, double, float, boolean, date, datetime, long, text, void.",
  "- Une ligne vide separe chaque classe.",
  "- Apres toutes les classes, liste les relations, une par ligne, prefixees par '#RELATION: '.",
  "- Le format d'une relation est: ClasseA|ClasseB|type|cardinaliteA|cardinaliteB",
  "- type doit etre l'un de: association, aggregation, composition, inheritance, dependency, realization",
  "- cardinaliteA et cardinaliteB doivent etre parmi: 1, 0..1, 1..*, 0..*, *",
  "- N'utilise que les noms de classes definis avec #CLASS: dans les relations.",
  "- Ne rajoute aucun texte en dehors de ce format."
].join("\n");

export function parseDiagramSyntax(raw) {
  const lines = String(raw || "").split("\n");
  const classes = [];
  const relations = [];
  let current = null;
  let placed = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      current = null;
      return;
    }

    if (line.toUpperCase().startsWith("#CLASS:")) {
      const name = line.slice(line.indexOf(":") + 1).trim();
      if (!name) return;
      current = {
        id: makeId(),
        name,
        x: 80 + (placed % 4) * 280,
        y: 80 + Math.floor(placed / 4) * 260,
        attributes: [],
        methods: []
      };
      placed += 1;
      classes.push(current);
      return;
    }

    if (line.toUpperCase().startsWith("#RELATION:")) {
      current = null;
      const payload = line.slice(line.indexOf(":") + 1).trim();
      const parts = payload.split("|").map((part) => part.trim());
      const [fromName, toName, type, cardA, cardB] = parts;
      const fromClass = classes.find((item) => item.name.toLowerCase() === (fromName || "").toLowerCase());
      const toClass = classes.find((item) => item.name.toLowerCase() === (toName || "").toLowerCase());
      if (fromClass && toClass) {
        relations.push({
          id: makeId(),
          fromId: fromClass.id,
          toId: toClass.id,
          type: normalizeRelationType(type),
          fromCardinality: cardA || "1",
          toCardinality: cardB || "*"
        });
      }
      return;
    }

    if (!current) return;

    const visibility = ["+", "-", "#", "~"].includes(line[0]) ? line[0] : "+";
    const rest = ["+", "-", "#", "~"].includes(line[0]) ? line.slice(1) : line;
    const isMethod = rest.includes("(");

    if (isMethod) {
      const match = rest.match(/^([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*:?\s*(.*)$/);
      if (match) {
        current.methods.push({
          id: makeId(),
          visibility,
          name: match[1],
          params: match[2] || "",
          returnType: match[3].trim() || "void"
        });
      }
    } else {
      const [namePart, typePart] = rest.split(":");
      if (namePart && namePart.trim()) {
        current.attributes.push({
          id: makeId(),
          visibility,
          name: namePart.trim(),
          type: (typePart || "string").trim()
        });
      }
    }
  });

  return { classes, relations };
}

export { RELATION_TYPES, makeId };
