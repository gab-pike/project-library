import { error, json } from '@sveltejs/kit';
import { duplicateProject, getProject } from '$lib/server/repos/projects';
import { DuplicateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	if (!getProject(params.id)) error(404, 'Project not found');
	const body = await request.json().catch(() => ({}));
	const parsed = DuplicateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const copy = duplicateProject(params.id, parsed.data);
	return json(copy, { status: 201 });
};
