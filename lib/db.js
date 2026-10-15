import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let instance = null;

function resolvePath() {
  const configured = process.env.DATABASE_PATH || "./data/pahaeposter.sqlite";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function getDb() {
  if (instance) return instance;
  const dbPath = resolvePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      user TEXT NOT NULL,
      password TEXT NOT NULL,
      database TEXT NOT NULL,
      createdat TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      createdat TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );
  `);
  return instance;
}
