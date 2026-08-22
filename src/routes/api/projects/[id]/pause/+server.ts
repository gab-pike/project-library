import { error, json } from '@sveltejs/kit';
import { pauseProject } from '$lib/server/repos/projects';
import { PauseInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = PauseInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = pauseProject(params.id, parsed.data);
	if (!updated) error(404, 'Project not found');
	return json(updated);
};
