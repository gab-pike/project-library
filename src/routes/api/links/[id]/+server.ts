import { error, json } from '@sveltejs/kit';
import { deleteLink, getLink, updateLink } from '$lib/server/repos/links';
import { LinkUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = LinkUpdateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = updateLink(params.id, parsed.data);
	if (!updated) error(404, 'Link not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getLink(params.id)) error(404, 'Link not found');
	deleteLink(params.id);
	return new Response(null, { status: 204 });
};
