import crypto from 'crypto';
import { AUTH_PASSWORD_HASH, SESSION_SECRET } from '$env/static/private';

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
