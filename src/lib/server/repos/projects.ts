import db from '../db';
import { randomUUID } from 'crypto';
import { createNote, listNotes } from './notes';
import { createTask, listTasks } from './tasks';
import { createUpdate, listUpdates } from './updates';
import { createLink, listLinks } from './links';

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

export interface PauseInput {
	pause_last_done?: string | null;
	pause_working_on?: string | null;
	pause_problems?: string | null;
	pause_next_steps?: string | null;
}

// The 4-field "bookmark" is stored on the project row (there's exactly one current bookmark)
// AND appended to the updates journal, so the context survives even after a later resume clears it.
export function pauseProject(id: string, input: PauseInput): Project | undefined {
	if (!getProject(id)) return undefined;
	const now = new Date().toISOString();

	db.prepare(
		`UPDATE projects SET status = 'paused', paused_at = ?, updated_at = ?,
		 pause_last_done = ?, pause_working_on = ?, pause_problems = ?, pause_next_steps = ?
		 WHERE id = ?`
	).run(
		now,
		now,
		input.pause_last_done ?? null,
		input.pause_working_on ?? null,
		input.pause_problems ?? null,
		input.pause_next_steps ?? null,
		id
	);

	const lines = [
		input.pause_last_done && `**Last done:** ${input.pause_last_done}`,
		input.pause_working_on && `**Was working on:** ${input.pause_working_on}`,
		input.pause_problems && `**Open problems:** ${input.pause_problems}`,
		input.pause_next_steps && `**Next steps:** ${input.pause_next_steps}`
	].filter((line): line is string => Boolean(line));
	if (lines.length > 0) {
		createUpdate(id, `Paused project\n\n${lines.join('\n\n')}`);
	}

	return getProject(id);
}

export function resumeProject(id: string): Project | undefined {
	if (!getProject(id)) return undefined;
	db.prepare(
		`UPDATE projects SET status = 'active', updated_at = ?,
		 paused_at = NULL, pause_last_done = NULL, pause_working_on = NULL, pause_problems = NULL, pause_next_steps = NULL
		 WHERE id = ?`
	).run(new Date().toISOString(), id);
	return getProject(id);
}

export function completeProject(id: string, summary: string): Project | undefined {
	if (!getProject(id)) return undefined;
	const now = new Date().toISOString();
	db.prepare(
		"UPDATE projects SET status = 'completed', completed_at = ?, updated_at = ?, summary = ? WHERE id = ?"
	).run(now, now, summary, id);
	return getProject(id);
}

export interface DuplicateOptions {
	title?: string | null;
	includeNotes?: boolean;
	includeTasks?: boolean;
	includeLinks?: boolean;
	includeUpdates?: boolean;
}

export function duplicateProject(id: string, options: DuplicateOptions = {}): Project | undefined {
	const source = getProject(id);
	if (!source) return undefined;

	const copy = createProject({
		title: options.title?.trim() || `${source.title} (copy)`,
		category_id: source.category_id,
		status: 'active',
		priority: source.priority,
		overview: source.overview,
		goals: source.goals
	});

	if (options.includeNotes) {
		for (const note of listNotes(id)) {
			createNote(copy.id, { title: note.title, body: note.body });
		}
	}
	if (options.includeTasks) {
		for (const task of listTasks(id)) {
			createTask(copy.id, { content: task.content, group_name: task.group_name, due_date: task.due_date });
		}
	}
	if (options.includeLinks) {
		for (const link of listLinks(id)) {
			createLink(copy.id, {
				url: link.url,
				title: link.title,
				description: link.description,
				group_name: link.group_name
			});
		}
	}
	if (options.includeUpdates) {
		// Oldest-first so the duplicate's journal reads in the same order it happened.
		for (const update of [...listUpdates(id)].reverse()) {
			createUpdate(copy.id, update.body);
		}
	}

	return copy;
}
