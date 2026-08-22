// src/lib/server/db.ts
import Database from 'better-sqlite3';
import { DATA_DIR } from '$env/static/private';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'library.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

runMigrations(db);

export default db;