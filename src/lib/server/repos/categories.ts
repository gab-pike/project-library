import db from '../db';
import { randomUUID } from 'crypto';

export interface Category {
	id: string;
	name: string;
	icon: string | null;
	color: string | null;
	sort_order: number;
	created_at: string;
}

export function listCategories(): Category[] {
	return db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all() as Category[];
}

export function getCategory(id: string): Category | undefined {
	return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
}

export interface CategoryInput {
	name: string;
	icon?: string | null;
	color?: string | null;
}

export function createCategory(input: CategoryInput): Category {
	const id = randomUUID();
	const now = new Date().toISOString();
	const { m } = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories').get() as {
		m: number;
	};
	db.prepare(
		'INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
	).run(id, input.name, input.icon ?? null, input.color ?? null, m + 1, now);
	return getCategory(id)!;
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Category | undefined {
	const existing = getCategory(id);
	if (!existing) return undefined;
	const merged = { ...existing, ...input };
	db.prepare('UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?').run(
		merged.name,
		merged.icon,
		merged.color,
		id
	);
	return getCategory(id);
}

export function deleteCategory(id: string): void {
	db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
