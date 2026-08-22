import db from '../db';
import { randomUUID } from 'crypto';

export interface Task {
	id: string;
	project_id: string;
	content: string;
	done: number;
	group_name: string | null;
	sort_order: number;
	due_date: string | null;
	created_at: string;
	completed_at: string | null;
}

export function listTasks(projectId: string): Task[] {
	return db
		.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order, created_at')
		.all(projectId) as Task[];
}

export function getTask(id: string): Task | undefined {
	return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export interface TaskInput {
	content: string;
	group_name?: string | null;
	due_date?: string | null;
}

export function createTask(projectId: string, input: TaskInput): Task {
	const id = randomUUID();
	const now = new Date().toISOString();
	const { m } = db
		.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM tasks WHERE project_id = ?')
		.get(projectId) as { m: number };
	db.prepare(
		'INSERT INTO tasks (id, project_id, content, done, group_name, sort_order, due_date, created_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?)'
	).run(id, projectId, input.content, input.group_name ?? null, m + 1, input.due_date ?? null, now);
	return getTask(id)!;
}

export function updateTask(id: string, input: Partial<TaskInput>): Task | undefined {
	const existing = getTask(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE tasks SET content = ?, group_name = ?, due_date = ? WHERE id = ?').run(
		merged.content,
		merged.group_name,
		merged.due_date,
		id
	);
	return getTask(id);
}

export function setTaskDone(id: string, done: boolean): Task | undefined {
	if (!getTask(id)) return undefined;
	db.prepare('UPDATE tasks SET done = ?, completed_at = ? WHERE id = ?').run(
		done ? 1 : 0,
		done ? new Date().toISOString() : null,
		id
	);
	return getTask(id);
}

export function deleteTask(id: string): void {
	db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// Swaps sort_order with the adjacent task in the same project — a simple reorder control
// (up/down buttons) rather than drag-and-drop, which works better on mobile anyway.
export function moveTask(id: string, direction: 'up' | 'down'): void {
	const task = getTask(id);
	if (!task) return;

	const neighbor =
		direction === 'up'
			? (db
					.prepare(
						'SELECT * FROM tasks WHERE project_id = ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1'
					)
					.get(task.project_id, task.sort_order) as Task | undefined)
			: (db
					.prepare(
						'SELECT * FROM tasks WHERE project_id = ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1'
					)
					.get(task.project_id, task.sort_order) as Task | undefined);
	if (!neighbor) return;

	const swap = db.transaction(() => {
		db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?').run(neighbor.sort_order, task.id);
		db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?').run(task.sort_order, neighbor.id);
	});
	swap();
}
