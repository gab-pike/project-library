import db from '../db';
import { randomUUID } from 'crypto';
import { createProject, type Project } from './projects';

export interface Idea {
	id: string;
	content: string;
	notes: string | null;
	created_at: string;
	promoted_project_id: string | null;
}

export function listIdeas(): Idea[] {
	return db
		.prepare('SELECT * FROM ideas WHERE promoted_project_id IS NULL ORDER BY created_at DESC')
		.all() as Idea[];
}

export function getIdea(id: string): Idea | undefined {
	return db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea | undefined;
}

export interface IdeaInput {
	content: string;
	notes?: string | null;
}

export function createIdea(input: IdeaInput): Idea {
	const id = randomUUID();
	const now = new Date().toISOString();
	db.prepare('INSERT INTO ideas (id, content, notes, created_at) VALUES (?, ?, ?, ?)').run(
		id,
		input.content,
		input.notes ?? null,
		now
	);
	return getIdea(id)!;
}

export function updateIdea(id: string, input: Partial<IdeaInput>): Idea | undefined {
	const existing = getIdea(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE ideas SET content = ?, notes = ? WHERE id = ?').run(merged.content, merged.notes, id);
	return getIdea(id);
}

export function deleteIdea(id: string): void {
	db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
}

// Promoting carries the idea's text into a new project's overview and links back to the idea for history.
export function promoteIdea(id: string, opts: { category_id?: string | null } = {}): Project | undefined {
	const idea = getIdea(id);
	if (!idea) return undefined;

	const project = createProject({
		title: idea.content.length > 200 ? `${idea.content.slice(0, 197)}...` : idea.content,
		category_id: opts.category_id ?? null,
		status: 'idea',
		overview: idea.notes ? `${idea.content}\n\n${idea.notes}` : idea.content
	});
	db.prepare('UPDATE ideas SET promoted_project_id = ? WHERE id = ?').run(project.id, id);
	return project;
}
