import fs from 'fs/promises';
import path from 'path';
import { listAllProjects, type Project } from './repos/projects';
import { listCategories } from './repos/categories';
import { listNotes } from './repos/notes';
import { listTasks } from './repos/tasks';
import { listUpdates } from './repos/updates';
import { listDates } from './repos/dates';
import { listLinks } from './repos/links';
import { listAssets } from './repos/assets';
import { ASSETS_DIR } from './assets';
import { DATA_DIR } from './env';

export const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

// Sortable, filesystem-safe timestamp for both export folder names and backup filenames.
export function exportTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

function slug(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '') || 'untitled'
	);
}

async function writeFile(filePath: string, content: string) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, content, 'utf8');
}

function projectReadme(project: Project, categoryName: string | undefined, dates: ReturnType<typeof listDates>) {
	const lines = [
		`# ${project.title}`,
		'',
		`- Category: ${categoryName ?? 'None'}`,
		`- Status: ${project.status}`,
		`- Priority: ${project.priority}`,
		`- Created: ${project.created_at}`,
		`- Updated: ${project.updated_at}`,
		'',
		'## Overview',
		'',
		project.overview || '_none_',
		'',
		'## Goals',
		'',
		project.goals || '_none_'
	];

	if (dates.length > 0) {
		lines.push('', '## Important dates', '');
		for (const d of dates) lines.push(`- ${d.date} — ${d.label} (${d.kind})`);
	}

	if (project.status === 'paused' && (project.pause_last_done || project.pause_working_on)) {
		lines.push(
			'',
			'## Pause bookmark',
			'',
			`- Last done: ${project.pause_last_done ?? '_none_'}`,
			`- Working on: ${project.pause_working_on ?? '_none_'}`,
			`- Problems: ${project.pause_problems ?? '_none_'}`,
			`- Next steps: ${project.pause_next_steps ?? '_none_'}`
		);
	}

	if (project.summary) {
		lines.push('', '## Summary', '', project.summary);
	}

	return lines.join('\n') + '\n';
}

function tasksMarkdown(tasks: ReturnType<typeof listTasks>): string {
	const groups = new Map<string, typeof tasks>();
	for (const t of tasks) {
		const key = t.group_name ?? 'Ungrouped';
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(t);
	}

	const lines: string[] = ['# Tasks', ''];
	for (const [group, items] of groups) {
		lines.push(`## ${group}`, '');
		for (const t of items) {
			lines.push(`- [${t.done ? 'x' : ' '}] ${t.content}${t.due_date ? ` (due ${t.due_date})` : ''}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

function updatesMarkdown(updates: ReturnType<typeof listUpdates>): string {
	const lines: string[] = ['# Updates', ''];
	for (const u of updates) {
		lines.push(`## ${u.created_at}`, '', u.body, '');
	}
	return lines.join('\n');
}

function linksMarkdown(links: ReturnType<typeof listLinks>): string {
	const groups = new Map<string, typeof links>();
	for (const l of links) {
		const key = l.group_name ?? 'Ungrouped';
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(l);
	}

	const lines: string[] = ['# Links', ''];
	for (const [group, items] of groups) {
		lines.push(`## ${group}`, '');
		for (const l of items) {
			lines.push(`- [${l.title || l.url}](${l.url})${l.description ? ` — ${l.description}` : ''}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

function assetsMarkdown(assets: ReturnType<typeof listAssets>, projectDir: string): string {
	const lines: string[] = ['# Assets', ''];
	for (const a of assets) {
		const relFromExport = path.relative(projectDir, path.join(ASSETS_DIR, a.rel_path));
		const isImage = a.mime?.startsWith('image/');
		const label = a.caption || a.filename;
		lines.push(isImage ? `![${label}](${relFromExport})` : `- [${label}](${relFromExport})`);
	}
	return lines.join('\n') + '\n';
}

export async function runExport(): Promise<string> {
	const dir = path.join(EXPORTS_DIR, exportTimestamp());
	const categories = new Map(listCategories().map((c) => [c.id, c.name]));

	for (const project of listAllProjects()) {
		const projectDir = path.join(dir, `${slug(project.title)}-${project.id.slice(0, 8)}`);
		const dates = listDates(project.id);
		const tasks = listTasks(project.id);
		const updates = listUpdates(project.id);
		const links = listLinks(project.id);
		const notes = listNotes(project.id);
		const assets = listAssets(project.id);

		await writeFile(
			path.join(projectDir, 'README.md'),
			projectReadme(project, categories.get(project.category_id ?? ''), dates)
		);
		if (tasks.length > 0) await writeFile(path.join(projectDir, 'tasks.md'), tasksMarkdown(tasks));
		if (updates.length > 0) await writeFile(path.join(projectDir, 'updates.md'), updatesMarkdown(updates));
		if (links.length > 0) await writeFile(path.join(projectDir, 'links.md'), linksMarkdown(links));
		if (assets.length > 0) {
			await writeFile(path.join(projectDir, 'assets.md'), assetsMarkdown(assets, projectDir));
		}
		for (const note of notes) {
			await writeFile(
				path.join(projectDir, 'notes', `${slug(note.title)}.md`),
				`# ${note.title}\n\n${note.body ?? ''}\n`
			);
		}
	}

	return dir;
}
