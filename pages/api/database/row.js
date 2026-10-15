import { runQuery } from "../../../lib/sqlHelpers";
import { getDecryptedConnection } from "../../../lib/connectionStore";

function quoteIdentifier(type, name) {
  return type === "postgres" ? `"${name}"` : `\`${name}\``;
}

function buildWhere(config, primaryKey) {
  return Object.keys(primaryKey)
    .map((key, index) => {
      const identifier = quoteIdentifier(config.type, key);
      const placeholder = config.type === "postgres" ? `$${index + 1}` : "?";
      return `${identifier} = ${placeholder}`;
    })
    .join(" AND ");
}

export default async function handler(req, res) {
  try {
    const { id, table, values, primaryKey } = req.body || {};
    const config = getDecryptedConnection(id);
    if (!config) return res.status(404).json({ error: "Connexion introuvable" });
    const identifier = quoteIdentifier(config.type, table);

    if (req.method === "POST") {
      const keys = Object.keys(values);
      const columns = keys.map((key) => quoteIdentifier(config.type, key)).join(", ");
      const placeholders = keys.map((key, index) => (config.type === "postgres" ? `$${index + 1}` : "?")).join(", ");
      const query = `INSERT INTO ${identifier} (${columns}) VALUES (${placeholders})`;
      await runQuery(config, query, Object.values(values));
      return res.status(201).json({ success: true });
    }

    if (req.method === "PUT") {
      const keys = Object.keys(values);
      const assignments = keys
        .map((key, index) => `${quoteIdentifier(config.type, key)} = ${config.type === "postgres" ? `$${index + 1}` : "?"}`)
        .join(", ");
      const whereKeys = Object.keys(primaryKey);
      const whereClause = whereKeys
        .map((key, index) => {
          const position = keys.length + index + 1;
          return `${quoteIdentifier(config.type, key)} = ${config.type === "postgres" ? `$${position}` : "?"}`;
        })
        .join(" AND ");
      const query = `UPDATE ${identifier} SET ${assignments} WHERE ${whereClause}`;
      await runQuery(config, query, [...Object.values(values), ...Object.values(primaryKey)]);
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const whereClause = buildWhere(config, primaryKey);
      const query = `DELETE FROM ${identifier} WHERE ${whereClause}`;
      await runQuery(config, query, Object.values(primaryKey));
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
