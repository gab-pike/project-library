import { json } from '@sveltejs/kit';
import { createLink, listLinks } from '$lib/server/repos/links';
import { LinkCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listLinks(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = LinkCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	return json(createLink(params.id, parsed.data), { status: 201 });
};
