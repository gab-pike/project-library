import db from '../db';
import { randomUUID } from 'crypto';

export interface Note {
	id: string;
	project_id: string;
	title: string;
	body: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export function listNotes(projectId: string): Note[] {
	return db
		.prepare('SELECT * FROM notes WHERE project_id = ? ORDER BY sort_order, created_at')
		.all(projectId) as Note[];
}

export function getNote(id: string): Note | undefined {
	return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export interface NoteInput {
	title: string;
	body?: string | null;
}

export function createNote(projectId: string, input: NoteInput): Note {
	const id = randomUUID();
	const now = new Date().toISOString();
	const { m } = db
		.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM notes WHERE project_id = ?')
		.get(projectId) as { m: number };
	db.prepare(
		'INSERT INTO notes (id, project_id, title, body, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
	).run(id, projectId, input.title, input.body ?? null, m + 1, now, now);
	return getNote(id)!;
}

export function updateNote(id: string, input: Partial<NoteInput>): Note | undefined {
	const existing = getNote(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?').run(
		merged.title,
		merged.body,
		new Date().toISOString(),
		id
	);
	return getNote(id);
}

export function deleteNote(id: string): void {
	db.prepare('DELETE FROM notes WHERE id = ?').run(id);
}
