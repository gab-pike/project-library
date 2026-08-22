import { json } from '@sveltejs/kit';
import { createUpdate, listUpdates } from '$lib/server/repos/updates';
import { UpdateCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listUpdates(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = UpdateCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	return json(createUpdate(params.id, parsed.data.body), { status: 201 });
};
