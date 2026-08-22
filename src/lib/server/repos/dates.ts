import db from '../db';
import { randomUUID } from 'crypto';

export type DateKind = 'deadline' | 'milestone' | 'appointment' | 'seasonal' | 'other';

export interface ProjectDate {
	id: string;
	project_id: string;
	label: string;
	date: string;
	kind: DateKind;
	notes: string | null;
}

export function listDates(projectId: string): ProjectDate[] {
	return db
		.prepare('SELECT * FROM dates WHERE project_id = ? ORDER BY date ASC')
		.all(projectId) as ProjectDate[];
}

export function getDate(id: string): ProjectDate | undefined {
	return db.prepare('SELECT * FROM dates WHERE id = ?').get(id) as ProjectDate | undefined;
}

export interface DateInput {
	label: string;
	date: string;
	kind?: DateKind;
	notes?: string | null;
}

export function createDate(projectId: string, input: DateInput): ProjectDate {
	const id = randomUUID();
	db.prepare('INSERT INTO dates (id, project_id, label, date, kind, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
		id,
		projectId,
		input.label,
		input.date,
		input.kind ?? 'other',
		input.notes ?? null
	);
	return getDate(id)!;
}

export function updateDate(id: string, input: Partial<DateInput>): ProjectDate | undefined {
	const existing = getDate(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE dates SET label = ?, date = ?, kind = ?, notes = ? WHERE id = ?').run(
		merged.label,
		merged.date,
		merged.kind,
		merged.notes,
		id
	);
	return getDate(id);
}

export function deleteDate(id: string): void {
	db.prepare('DELETE FROM dates WHERE id = ?').run(id);
}

export interface UpcomingDate extends ProjectDate {
	project_title: string;
}

export function listUpcomingDates(limit = 5): UpcomingDate[] {
	const today = new Date().toISOString().slice(0, 10);
	return db
		.prepare(
			`SELECT dates.*, projects.title AS project_title
			 FROM dates JOIN projects ON projects.id = dates.project_id
			 WHERE dates.date >= ? AND projects.status != 'archived'
			 ORDER BY dates.date ASC LIMIT ?`
		)
		.all(today, limit) as UpcomingDate[];
}
