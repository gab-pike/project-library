import { json } from '@sveltejs/kit';
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const body = await request.json().catch(() => ({}));
	const password = typeof body.password === 'string' ? body.password : '';

	if (!verifyPassword(password)) {
		return json({ error: 'Incorrect password' }, { status: 401 });
	}

	cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// See src/routes/login/+page.server.ts — same fix, same reason.
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 30
	});

	return json({ ok: true });
};
