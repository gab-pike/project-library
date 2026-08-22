import { error, json } from '@sveltejs/kit';
import { completeProject } from '$lib/server/repos/projects';
import { CompleteInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = CompleteInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = completeProject(params.id, parsed.data.summary);
	if (!updated) error(404, 'Project not found');
	return json(updated);
};
