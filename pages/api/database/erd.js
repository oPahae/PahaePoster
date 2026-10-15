import { listTables, getTableSchema, getRelations } from "../../../lib/sqlHelpers";
import { getDecryptedConnection } from "../../../lib/connectionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  try {
    const { id } = req.body || {};
    const config = getDecryptedConnection(id);
    if (!config) return res.status(404).json({ error: "Connexion introuvable" });

    const tableNames = await listTables(config);
    const tables = await Promise.all(
      tableNames.map(async (name) => ({
        name,
        columns: await getTableSchema(config, name)
      }))
    );
    const relations = await getRelations(config);

    return res.status(200).json({ tables, relations });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
