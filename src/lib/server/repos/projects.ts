import db from '../db';
import { randomUUID } from 'crypto';

export type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed' | 'archived';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface Project {
	id: string;
	title: string;
	category_id: string | null;
	status: ProjectStatus;
	priority: ProjectPriority;
	overview: string | null;
	goals: string | null;
	cover_asset_id: string | null;
	created_at: string;
	updated_at: string;
	paused_at: string | null;
	completed_at: string | null;
	pause_last_done: string | null;
	pause_working_on: string | null;
	pause_problems: string | null;
	pause_next_steps: string | null;
	summary: string | null;
}

export interface ProjectFilters {
	status?: ProjectStatus;
	category_id?: string;
	priority?: ProjectPriority;
	q?: string;
}

export function listProjects(filters: ProjectFilters = {}): Project[] {
	const clauses: string[] = [];
	const params: unknown[] = [];

	if (filters.status) {
		clauses.push('status = ?');
		params.push(filters.status);
	} else {
		// Hide archived projects from the default library view — they're soft-deleted, not gone.
		clauses.push("status != 'archived'");
	}
	if (filters.category_id) {
		clauses.push('category_id = ?');
		params.push(filters.category_id);
	}
	if (filters.priority) {
		clauses.push('priority = ?');
		params.push(filters.priority);
	}
	if (filters.q) {
		clauses.push('(title LIKE ? OR overview LIKE ?)');
		const like = `%${filters.q}%`;
		params.push(like, like);
	}

	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
	return db.prepare(`SELECT * FROM projects ${where} ORDER BY updated_at DESC`).all(...params) as Project[];
}

export function getProject(id: string): Project | undefined {
	return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export interface ProjectInput {
	title: string;
	category_id?: string | null;
	status?: ProjectStatus;
	priority?: ProjectPriority;
	overview?: string | null;
	goals?: string | null;
}

export function createProject(input: ProjectInput): Project {
	const id = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO projects (id, title, category_id, status, priority, overview, goals, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		id,
		input.title,
		input.category_id ?? null,
		input.status ?? 'active',
		input.priority ?? 'medium',
		input.overview ?? null,
		input.goals ?? null,
		now,
		now
	);
	return getProject(id)!;
}

export function updateProject(id: string, input: Partial<ProjectInput>): Project | undefined {
	const existing = getProject(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	const now = new Date().toISOString();
	db.prepare(
		`UPDATE projects SET title = ?, category_id = ?, status = ?, priority = ?, overview = ?, goals = ?, updated_at = ?
		 WHERE id = ?`
	).run(merged.title, merged.category_id, merged.status, merged.priority, merged.overview, merged.goals, now, id);
	return getProject(id);
}

// Soft-delete: projects move to 'archived' rather than being removed, per architecture.md §10 Phase 1.
export function archiveProject(id: string): Project | undefined {
	db.prepare("UPDATE projects SET status = 'archived', updated_at = ? WHERE id = ?").run(
		new Date().toISOString(),
		id
	);
	return getProject(id);
}
