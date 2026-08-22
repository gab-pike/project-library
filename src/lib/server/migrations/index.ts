import type Database from 'better-sqlite3';
import m001 from './001_init.sql?raw';
import m002 from './002_seed_categories.sql?raw';
import m003 from './003_workspace.sql?raw';
import m004 from './004_assets.sql?raw';

// Add new migrations here as { version, name, sql } — never edit a shipped migration's sql.
const migrations = [
	{ version: 1, name: '001_init', sql: m001 },
	{ version: 2, name: '002_seed_categories', sql: m002 },
	{ version: 3, name: '003_workspace', sql: m003 },
	{ version: 4, name: '004_assets', sql: m004 }
];

export function runMigrations(db: Database.Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS _migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TEXT NOT NULL
		);
	`);

	const applied = new Set(
		db.prepare('SELECT version FROM _migrations').all().map((row) => (row as { version: number }).version)
	);

	for (const migration of migrations) {
		if (applied.has(migration.version)) continue;

		const apply = db.transaction(() => {
			db.exec(migration.sql);
			db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
				migration.version,
				migration.name,
				new Date().toISOString()
			);
		});
		apply();
	}
}
