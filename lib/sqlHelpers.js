import mysql from "mysql2/promise";
import { Client as PgClient } from "pg";
import { detectMime } from "./blobDetect";

const MAX_INLINE_BLOB_BYTES = 12 * 1024 * 1024;

function serializeValue(value) {
  if (Buffer.isBuffer(value)) {
    if (value.length > MAX_INLINE_BLOB_BYTES) {
      return { __pahaeBlob: true, mime: "application/octet-stream", tooLarge: true, size: value.length };
    }
    return { __pahaeBlob: true, mime: detectMime(value), base64: value.toString("base64"), size: value.length };
  }
  return value;
}

function serializeRows(rows) {
  return rows.map((row) => {
    const next = {};
    Object.keys(row).forEach((key) => {
      next[key] = serializeValue(row[key]);
    });
    return next;
  });
}

export async function testConnection(config) {
  if (config.type === "mysql") {
    const connection = await mysql.createConnection({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000
    });
    await connection.query("SELECT 1");
    await connection.end();
    return true;
  }
  if (config.type === "postgres") {
    const client = new PgClient({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 5000
    });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  }
  throw new Error("Type de base de donnees non supporte");
}

export async function runQuery(config, sql, params = []) {
  const start = Date.now();
  if (config.type === "mysql") {
    const connection = await mysql.createConnection({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database
    });
    try {
      const [rows, fields] = await connection.query(sql, params);
      const durationMs = Date.now() - start;
      const columns = Array.isArray(fields) ? fields.map((f) => f.name) : [];
      const safeRows = Array.isArray(rows) ? serializeRows(rows) : [];
      return { rows: safeRows, columns, durationMs, affectedRows: rows && rows.affectedRows };
    } finally {
      await connection.end();
    }
  }
  if (config.type === "postgres") {
    const client = new PgClient({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database
    });
    await client.connect();
    try {
      const result = await client.query(sql, params);
      const durationMs = Date.now() - start;
      const columns = result.fields ? result.fields.map((f) => f.name) : [];
      return { rows: serializeRows(result.rows), columns, durationMs, affectedRows: result.rowCount };
    } finally {
      await client.end();
    }
  }
  throw new Error("Type de base de donnees non supporte");
}

export async function listTables(config) {
  if (config.type === "mysql") {
    const { rows } = await runQuery(config, "SHOW TABLES");
    return rows.map((row) => Object.values(row)[0]);
  }
  if (config.type === "postgres") {
    const { rows } = await runQuery(
      config,
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    return rows.map((row) => row.table_name);
  }
  throw new Error("Type de base de donnees non supporte");
}

export async function getTableSchema(config, table) {
  if (config.type === "mysql") {
    const { rows } = await runQuery(config, "DESCRIBE ??", [table]);
    return rows.map((row) => ({
      column: row.Field,
      type: row.Type,
      nullable: row.Null === "YES",
      key: row.Key,
      default: row.Default
    }));
  }
  if (config.type === "postgres") {
    const { rows } = await runQuery(
      config,
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      [table]
    );
    return rows.map((row) => ({
      column: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
      key: "",
      default: row.column_default
    }));
  }
  throw new Error("Type de base de donnees non supporte");
}

export async function getRelations(config) {
  if (config.type === "mysql") {
    const { rows } = await runQuery(
      config,
      `SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName, REFERENCED_TABLE_NAME as refTable, REFERENCED_COLUMN_NAME as refColumn
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = DATABASE()`
    );
    return rows;
  }
  if (config.type === "postgres") {
    const { rows } = await runQuery(
      config,
      `SELECT
        tc.table_name as "tableName",
        kcu.column_name as "columnName",
        ccu.table_name AS "refTable",
        ccu.column_name AS "refColumn"
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'`
    );
    return rows;
  }
  return [];
}
