// src/lib/server/db.ts
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

const DATA_DIR = env.DATA_DIR ?? './data';

let instance: Database.Database | undefined;

function getInstance(): Database.Database {
	if (!instance) {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true });
		}

		const dbPath = path.join(DATA_DIR, 'library.db');
		instance = new Database(dbPath);
		instance.pragma('journal_mode = WAL');
		instance.pragma('busy_timeout = 5000');
		instance.pragma('foreign_keys = ON');

		runMigrations(instance);
	}
	return instance;
}

// A lazy singleton: the real SQLite connection (and migrations) only opens on first actual
// use, not at module-import time. SvelteKit's build step imports this module chain (via
// hooks.server.ts -> scheduler.ts) without ever calling into it — but eagerly opening a native
// addon at import time meant Vite's worker-thread SSR build analysis ended up dlopen'ing
// better-sqlite3's .node binary there too, which breaks on Alpine/musl even though the exact
// same binary loads fine on the main thread. Deferring the open sidesteps that entirely.
const db = new Proxy({} as Database.Database, {
	get(_target, prop) {
		const real = getInstance();
		const value = Reflect.get(real, prop, real);
		return typeof value === 'function' ? value.bind(real) : value;
	}
});

export default db;
