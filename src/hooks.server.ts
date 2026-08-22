// src/hooks.server.ts
import { config } from 'dotenv';
config(); // Loads .env from project root

import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, verifySessionToken } from '$lib/server/auth';
import { startScheduler } from '$lib/server/scheduler';

// Module scope — runs once when the server process loads this file, not per-request.
startScheduler();

const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAuthRoute = pathname.startsWith('/api/auth/');
	const isPublic = PUBLIC_PATHS.has(pathname) || isAuthRoute;

	const authenticated = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));
	event.locals.authenticated = authenticated;

	if (!authenticated && !isPublic) {
		if (pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	return resolve(event);
};
