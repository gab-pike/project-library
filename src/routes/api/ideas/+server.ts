import { json } from '@sveltejs/kit';
import { createIdea, listIdeas } from '$lib/server/repos/ideas';
import { IdeaCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listIdeas());
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = IdeaCreateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	return json(createIdea(parsed.data), { status: 201 });
};
