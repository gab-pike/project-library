import { fail, redirect } from '@sveltejs/kit';
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.authenticated) {
		redirect(303, url.searchParams.get('redirectTo') || '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (!verifyPassword(password)) {
			return fail(401, { error: 'Incorrect password' });
		}

		cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// SvelteKit defaults secure:true in production regardless of actual protocol — browsers
			// silently drop Secure cookies set over plain HTTP, which breaks direct IP:port access
			// (no TLS) without ever surfacing an error. Derive it from the real request instead.
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, url.searchParams.get('redirectTo') || '/');
	}
};
