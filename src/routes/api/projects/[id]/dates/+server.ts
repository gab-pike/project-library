import { json } from '@sveltejs/kit';
import { createDate, listDates } from '$lib/server/repos/dates';
import { DateCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listDates(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = DateCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	return json(createDate(params.id, parsed.data), { status: 201 });
};
