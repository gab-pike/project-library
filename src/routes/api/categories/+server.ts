import { json } from '@sveltejs/kit';
import { createCategory, listCategories } from '$lib/server/repos/categories';
import { CategoryCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listCategories());
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = CategoryCreateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	return json(createCategory(parsed.data), { status: 201 });
};
