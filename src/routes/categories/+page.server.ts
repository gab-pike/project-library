import { fail } from '@sveltejs/kit';
import { createCategory, deleteCategory, listCategories } from '$lib/server/repos/categories';
import { CategoryCreateInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { categories: listCategories() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const parsed = CategoryCreateInput.safeParse({
			name: String(data.get('name') ?? ''),
			icon: String(data.get('icon') ?? '') || null
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().fieldErrors });
		}
		createCategory(parsed.data);
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		deleteCategory(String(data.get('id') ?? ''));
	}
};
