import { fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/repos/categories';
import { createIdea, deleteIdea, listIdeas, promoteIdea, updateIdea } from '$lib/server/repos/ideas';
import { IdeaCreateInput, IdeaUpdateInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { ideas: listIdeas(), categories: listCategories() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const parsed = IdeaCreateInput.safeParse({
			content: String(data.get('content') ?? ''),
			notes: String(data.get('notes') ?? '') || null
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().fieldErrors });
		}
		createIdea(parsed.data);
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const parsed = IdeaUpdateInput.safeParse({
			content: String(data.get('content') ?? ''),
			notes: String(data.get('notes') ?? '') || null
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().fieldErrors });
		}
		updateIdea(id, parsed.data);
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		deleteIdea(String(data.get('id') ?? ''));
	},

	promote: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const category_id = String(data.get('category_id') ?? '') || null;
		const project = promoteIdea(id, { category_id });
		if (project) redirect(303, `/projects/${project.id}`);
	}
};
