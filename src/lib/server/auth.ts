import crypto from 'crypto';
import { env } from '$env/dynamic/private';

const AUTH_PASSWORD_HASH = env.AUTH_PASSWORD_HASH ?? '';
const SESSION_SECRET = env.SESSION_SECRET ?? '';

// Two footguns that otherwise fail silently as "every login gets Incorrect password" with
// no clue why: the var left blank, or a plaintext password pasted in where the scrypt
// 'salt:hash' output belongs. Surface both loudly in the server logs at boot instead.
if (!/^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(AUTH_PASSWORD_HASH)) {
	console.warn(
		'[auth] AUTH_PASSWORD_HASH is missing or not in the expected salt:hash format — ' +
			'every login will fail. Generate it with the scrypt command in .env.example; ' +
			'it holds the hash output, never the plaintext password itself.'
	);
}
if (!SESSION_SECRET) {
	console.warn('[auth] SESSION_SECRET is empty — session cookies will not be verifiable. Set it in .env.');
}

export const SESSION_COOKIE_NAME = 'session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16);
	const hash = crypto.scryptSync(password, salt, 64);
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string): boolean {
	const [saltHex, hashHex] = AUTH_PASSWORD_HASH.split(':');
	if (!saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const actual = crypto.scryptSync(password, salt, expected.length);
	return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function sign(value: string): string {
	return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export function createSessionToken(): string {
	const payload = String(Date.now() + SESSION_TTL_MS);
	return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
	if (!token) return false;
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return false;

	const expectedBuf = Buffer.from(sign(payload));
	const sigBuf = Buffer.from(sig);
	if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
		return false;
	}

	const expires = Number(payload);
	return Number.isFinite(expires) && Date.now() < expires;
}
