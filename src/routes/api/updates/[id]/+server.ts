import { error, json } from '@sveltejs/kit';
import { deleteUpdate, getUpdate, updateUpdate } from '$lib/server/repos/updates';
import { UpdateCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = UpdateCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = updateUpdate(params.id, parsed.data.body);
	if (!updated) error(404, 'Update not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getUpdate(params.id)) error(404, 'Update not found');
	deleteUpdate(params.id);
	return new Response(null, { status: 204 });
};
