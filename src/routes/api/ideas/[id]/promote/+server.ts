import { error, json } from '@sveltejs/kit';
import { getIdea, promoteIdea } from '$lib/server/repos/ideas';
import { IdeaPromoteInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	if (!getIdea(params.id)) error(404, 'Idea not found');

	const body = await request.json().catch(() => ({}));
	const parsed = IdeaPromoteInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}

	const project = promoteIdea(params.id, parsed.data);
	return json(project, { status: 201 });
};
