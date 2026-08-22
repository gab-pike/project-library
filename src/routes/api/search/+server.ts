import { json } from '@sveltejs/kit';
import { searchAll } from '$lib/server/repos/search';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	return json(searchAll(q));
};
