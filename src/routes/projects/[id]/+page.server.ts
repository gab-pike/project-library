import { error, fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/repos/categories';
import { archiveProject, getProject, updateProject } from '$lib/server/repos/projects';
import { ProjectUpdateInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.id);
	if (!project) error(404, 'Project not found');
	return { project, categories: listCategories() };
};

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
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().fieldErrors, values: raw });
		}

		const updated = updateProject(params.id, parsed.data);
		if (!updated) error(404, 'Project not found');
		return { saved: true };
	},

	archive: async ({ params }) => {
		archiveProject(params.id);
		redirect(303, '/');
	}
};
