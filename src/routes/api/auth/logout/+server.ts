import { json } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
	return json({ ok: true });
};
