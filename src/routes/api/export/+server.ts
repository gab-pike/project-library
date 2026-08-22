import { json } from '@sveltejs/kit';
import { runExport } from '$lib/server/export';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const dir = await runExport();
	return json({ dir }, { status: 201 });
};
