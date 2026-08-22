import { error, json } from '@sveltejs/kit';
import { deleteCategory, getCategory, updateCategory } from '$lib/server/repos/categories';
import { CategoryUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = CategoryUpdateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const updated = updateCategory(params.id, parsed.data);
	if (!updated) error(404, 'Category not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getCategory(params.id)) error(404, 'Category not found');
	deleteCategory(params.id);
	return new Response(null, { status: 204 });
};
