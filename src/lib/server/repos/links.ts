import db from '../db';
import { randomUUID } from 'crypto';

export interface Link {
	id: string;
	project_id: string;
	url: string;
	title: string | null;
	description: string | null;
	group_name: string | null;
	created_at: string;
}

export function listLinks(projectId: string): Link[] {
	return db
		.prepare('SELECT * FROM links WHERE project_id = ? ORDER BY group_name, created_at')
		.all(projectId) as Link[];
}

export function getLink(id: string): Link | undefined {
	return db.prepare('SELECT * FROM links WHERE id = ?').get(id) as Link | undefined;
}

export interface LinkInput {
	url: string;
	title?: string | null;
	description?: string | null;
	group_name?: string | null;
}

export function createLink(projectId: string, input: LinkInput): Link {
	const id = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		'INSERT INTO links (id, project_id, url, title, description, group_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
	).run(id, projectId, input.url, input.title ?? null, input.description ?? null, input.group_name ?? null, now);
	return getLink(id)!;
}

export function updateLink(id: string, input: Partial<LinkInput>): Link | undefined {
	const existing = getLink(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE links SET url = ?, title = ?, description = ?, group_name = ? WHERE id = ?').run(
		merged.url,
		merged.title,
		merged.description,
		merged.group_name,
		id
	);
	return getLink(id);
}

export function deleteLink(id: string): void {
	db.prepare('DELETE FROM links WHERE id = ?').run(id);
}
