import { error, json } from '@sveltejs/kit';
import { deleteIdea, getIdea, updateIdea } from '$lib/server/repos/ideas';
import { IdeaUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = IdeaUpdateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const updated = updateIdea(params.id, parsed.data);
	if (!updated) error(404, 'Idea not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getIdea(params.id)) error(404, 'Idea not found');
	deleteIdea(params.id);
	return new Response(null, { status: 204 });
};
