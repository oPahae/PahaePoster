import { runQuery } from "../../../lib/sqlHelpers";
import { getDecryptedConnection } from "../../../lib/connectionStore";

function quoteIdentifier(type, name) {
  return type === "postgres" ? `"${name}"` : `\`${name}\``;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    const { id, table, page = 1, pageSize = 25, search = "" } = req.body || {};
    const config = getDecryptedConnection(id);
    if (!config) return res.status(404).json({ error: "Connexion introuvable" });

    const identifier = quoteIdentifier(config.type, table);
    const offset = (Number(page) - 1) * Number(pageSize);
    const query = `SELECT * FROM ${identifier} LIMIT ${Number(pageSize)} OFFSET ${offset}`;

    const { rows, columns, durationMs } = await runQuery(config, query);

    let filteredRows = rows;
    if (search) {
      const needle = search.toLowerCase();
      filteredRows = rows.filter((row) =>
        Object.values(row).some((value) => {
          if (value && typeof value === "object" && value.__pahaeBlob) return false;
          return String(value ?? "").toLowerCase().includes(needle);
        })
      );
    }

    const countResult = await runQuery(config, `SELECT COUNT(*) as total FROM ${identifier}`);
    const total = countResult.rows[0] ? Number(Object.values(countResult.rows[0])[0]) : rows.length;

    return res.status(200).json({ rows: filteredRows, columns, durationMs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
