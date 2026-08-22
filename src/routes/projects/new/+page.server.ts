import { fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/repos/categories';
import { createProject } from '$lib/server/repos/projects';
import { ProjectCreateInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { categories: listCategories() };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const raw = {
			title: String(data.get('title') ?? ''),
			category_id: String(data.get('category_id') ?? '') || null,
			status: String(data.get('status') ?? ''),
			priority: String(data.get('priority') ?? ''),
			overview: String(data.get('overview') ?? '') || null,
			goals: String(data.get('goals') ?? '') || null
		};

		const parsed = ProjectCreateInput.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().fieldErrors, values: raw });
		}

		const project = createProject(parsed.data);
		redirect(303, `/projects/${project.id}`);
	}
};
