const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "pulse.db");
const db = new Database(dbPath);

// Create tables (PRODUCTION-READY SCHEMA)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profile (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_path TEXT NOT NULL,
    avatar_hash TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS avatar_cache (
    user_id TEXT PRIMARY KEY,
    avatar_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    updated_at INTEGER
  );
`);

module.exports = db;
