import { error, json } from '@sveltejs/kit';
import { deleteDate, getDate, updateDate } from '$lib/server/repos/dates';
import { DateUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = DateUpdateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = updateDate(params.id, parsed.data);
	if (!updated) error(404, 'Date not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getDate(params.id)) error(404, 'Date not found');
	deleteDate(params.id);
	return new Response(null, { status: 204 });
};
