import db from '../db';
import { randomUUID } from 'crypto';

export interface ProjectUpdate {
	id: string;
	project_id: string;
	body: string;
	created_at: string;
}

export function listUpdates(projectId: string): ProjectUpdate[] {
	return db
		.prepare('SELECT * FROM updates WHERE project_id = ? ORDER BY created_at DESC')
		.all(projectId) as ProjectUpdate[];
}

export function getUpdate(id: string): ProjectUpdate | undefined {
	return db.prepare('SELECT * FROM updates WHERE id = ?').get(id) as ProjectUpdate | undefined;
}

export function createUpdate(projectId: string, body: string): ProjectUpdate {
	const id = randomUUID();
	const now = new Date().toISOString();
	db.prepare('INSERT INTO updates (id, project_id, body, created_at) VALUES (?, ?, ?, ?)').run(
		id,
		projectId,
		body,
		now
	);
	// Touch the project so "last touched" sorting on the library screen reflects the new entry.
	db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);
	return getUpdate(id)!;
}

export function updateUpdate(id: string, body: string): ProjectUpdate | undefined {
	if (!getUpdate(id)) return undefined;
	db.prepare('UPDATE updates SET body = ? WHERE id = ?').run(body, id);
	return getUpdate(id);
}

export function deleteUpdate(id: string): void {
	db.prepare('DELETE FROM updates WHERE id = ?').run(id);
}
