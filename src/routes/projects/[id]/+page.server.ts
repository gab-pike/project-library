import { error, fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/repos/categories';
import { archiveProject, getProject, updateProject } from '$lib/server/repos/projects';
import { createNote, deleteNote, listNotes, updateNote } from '$lib/server/repos/notes';
import { createTask, deleteTask, listTasks, moveTask, setTaskDone, updateTask } from '$lib/server/repos/tasks';
import { createUpdate, deleteUpdate, listUpdates } from '$lib/server/repos/updates';
import { createDate, deleteDate, listDates, updateDate } from '$lib/server/repos/dates';
import { createLink, deleteLink, listLinks, updateLink } from '$lib/server/repos/links';
import {
	DateCreateInput,
	DateUpdateInput,
	LinkCreateInput,
	LinkUpdateInput,
	NoteCreateInput,
	NoteUpdateInput,
	ProjectUpdateInput,
	TaskCreateInput,
	TaskUpdateInput,
	UpdateCreateInput
} from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.id);
	if (!project) error(404, 'Project not found');

	return {
		project,
		categories: listCategories(),
		notes: listNotes(params.id),
		tasks: listTasks(params.id),
		updates: listUpdates(params.id),
		dates: listDates(params.id),
		links: listLinks(params.id)
	};
};

function formToObject(data: FormData) {
	return Object.fromEntries(data.entries()) as Record<string, string>;
}

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const raw = {
			title: String(data.get('title') ?? ''),
			category_id: String(data.get('category_id') ?? '') || null,
			status: String(data.get('status') ?? ''),
			priority: String(data.get('priority') ?? ''),
			overview: String(data.get('overview') ?? '') || null,
			goals: String(data.get('goals') ?? '') || null
		};
		const parsed = ProjectUpdateInput.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors, values: raw });
		const updated = updateProject(params.id, parsed.data);
		if (!updated) error(404, 'Project not found');
		return { saved: true };
	},

	archive: async ({ params }) => {
		archiveProject(params.id);
		redirect(303, '/');
	},

	createNote: async ({ request, params }) => {
		const parsed = NoteCreateInput.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		createNote(params.id, parsed.data);
	},

	updateNote: async ({ request }) => {
		const data = formToObject(await request.formData());
		const parsed = NoteUpdateInput.safeParse(data);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		updateNote(data.id, parsed.data);
	},

	deleteNote: async ({ request }) => {
		const data = await request.formData();
		deleteNote(String(data.get('id') ?? ''));
	},

	createTask: async ({ request, params }) => {
		const parsed = TaskCreateInput.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		createTask(params.id, parsed.data);
	},

	updateTask: async ({ request }) => {
		const data = formToObject(await request.formData());
		const parsed = TaskUpdateInput.safeParse(data);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		updateTask(data.id, parsed.data);
	},

	setTaskDone: async ({ request }) => {
		const data = await request.formData();
		// A hidden "false" input plus the checkbox sharing name="done" means both values can be
		// present when checked; FormData.get() only returns the first, so use getAll() instead.
		const done = data.getAll('done').includes('true');
		setTaskDone(String(data.get('id') ?? ''), done);
	},

	deleteTask: async ({ request }) => {
		const data = await request.formData();
		deleteTask(String(data.get('id') ?? ''));
	},

	moveTask: async ({ request }) => {
		const data = await request.formData();
		const direction = String(data.get('direction') ?? '') === 'up' ? 'up' : 'down';
		moveTask(String(data.get('id') ?? ''), direction);
	},

	createUpdate: async ({ request, params }) => {
		const data = formToObject(await request.formData());
		const parsed = UpdateCreateInput.safeParse(data);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		createUpdate(params.id, parsed.data.body);
	},

	deleteUpdate: async ({ request }) => {
		const data = await request.formData();
		deleteUpdate(String(data.get('id') ?? ''));
	},

	createDate: async ({ request, params }) => {
		const parsed = DateCreateInput.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		createDate(params.id, parsed.data);
	},

	updateDate: async ({ request }) => {
		const data = formToObject(await request.formData());
		const parsed = DateUpdateInput.safeParse(data);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		updateDate(data.id, parsed.data);
	},

	deleteDate: async ({ request }) => {
		const data = await request.formData();
		deleteDate(String(data.get('id') ?? ''));
	},

	createLink: async ({ request, params }) => {
		const parsed = LinkCreateInput.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		createLink(params.id, parsed.data);
	},

	updateLink: async ({ request }) => {
		const data = formToObject(await request.formData());
		const parsed = LinkUpdateInput.safeParse(data);
		if (!parsed.success) return fail(400, { error: parsed.error.flatten().fieldErrors });
		updateLink(data.id, parsed.data);
	},

	deleteLink: async ({ request }) => {
		const data = await request.formData();
		deleteLink(String(data.get('id') ?? ''));
	}
};
