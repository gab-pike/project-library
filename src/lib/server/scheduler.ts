import fs from 'fs/promises';
import path from 'path';
import db from './db';
import { DATA_DIR } from '$env/static/private';
import { EXPORTS_DIR, exportTimestamp, runExport } from './export';

const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const KEEP_BACKUPS = 14;
const KEEP_EXPORTS = 2;

export async function runBackup(): Promise<string> {
	await fs.mkdir(BACKUPS_DIR, { recursive: true });
	const dest = path.join(BACKUPS_DIR, `library-${exportTimestamp()}.db`);
	// VACUUM INTO produces a consistent snapshot safe to take while the app keeps running.
	db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
	await pruneOldEntries(BACKUPS_DIR, KEEP_BACKUPS);
	return dest;
}

async function pruneOldEntries(dir: string, keep: number): Promise<void> {
	const entries = await fs.readdir(dir).catch(() => [] as string[]);
	entries.sort(); // sortable timestamp-based names => alphabetical sort is chronological
	const excess = entries.slice(0, Math.max(0, entries.length - keep));
	for (const name of excess) {
		await fs.rm(path.join(dir, name), { recursive: true, force: true });
	}
}

async function runNightlyMaintenance(): Promise<void> {
	await runBackup();
	await runExport();
	await pruneOldEntries(EXPORTS_DIR, KEEP_EXPORTS);
}

function msUntilNextRun(hour = 2): number {
	const now = new Date();
	const next = new Date(now);
	next.setHours(hour, 0, 0, 0);
	if (next <= now) next.setDate(next.getDate() + 1);
	return next.getTime() - now.getTime();
}

function scheduleNextRun(): void {
	setTimeout(async () => {
		try {
			await runNightlyMaintenance();
		} catch (err) {
			console.error('Nightly maintenance run failed:', err);
		} finally {
			scheduleNextRun();
		}
	}, msUntilNextRun());
}

// hooks.server.ts is a module, loaded once per server process — this guard just protects
// against a double call if something re-imports it, not against genuine multi-process setups.
let started = false;
export function startScheduler(): void {
	if (started) return;
	started = true;
	scheduleNextRun();
}
