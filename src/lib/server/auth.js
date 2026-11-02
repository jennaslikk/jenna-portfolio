import { createHash, randomBytes } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { database } from '#lib/server/db';
import { hashPassword, verifyPassword } from '#lib/server/passwords';

export const SESSION_COOKIE = 'studio_session';
const SESSION_SECONDS = 60 * 60 * 12;
const cookieOptions = { path: '/', httpOnly: true, secure: true, sameSite: 'lax' };
let dummyPasswordHash;

export function sessionId(token) {
 // A database leak should not reveal usable browser session tokens.
 return createHash('sha256').update(token).digest('hex');
}

export function clearSessionCookie(cookies) {
 cookies.delete(SESSION_COOKIE, cookieOptions);
}

export async function sessionUser(token) {
 if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
 const sql = database();
 const rows = await sql`SELECT users.id::text AS id, users.username
  FROM sessions JOIN users ON users.id = sessions.user_id
  WHERE sessions.id = ${sessionId(token)} AND sessions.expires_at > now()`;
 return rows[0] || null;
}

export function requireUser(locals) {
 if (!locals.user) error(401, 'Please sign in to use the studio.');
 return locals.user;
}

export async function checkPassword(username, password) {
 const sql = database();
 const rows = await sql`SELECT id::text AS id, username, password_hash FROM users WHERE username = ${username}`;
 // Unknown usernames still do bcrypt work, avoiding a fast account-existence check.
 dummyPasswordHash ??= hashPassword(randomBytes(32).toString('hex'));
 const passwordHash = rows[0]?.password_hash || await dummyPasswordHash;
 const matches = await verifyPassword(password, passwordHash);
 return matches && rows[0] ? { id: rows[0].id, username: rows[0].username } : null;
}

export async function allowLogin(address, username) {
 const sql = database();
 const windowStart = new Date(Math.floor(Date.now() / 900000) * 900000).toISOString();
 const ipKey = sessionId(`ip:${address}`);
 const userKey = sessionId(`username:${username}`);
 // Database counters work across processes; restarting the app cannot bypass the limit.
 const results = await sql.transaction([
  sql`INSERT INTO login_attempts (key, window_start, attempts) VALUES (${ipKey}, ${windowStart}, 1)
   ON CONFLICT (key, window_start) DO UPDATE SET attempts = login_attempts.attempts + 1 RETURNING attempts`,
  sql`INSERT INTO login_attempts (key, window_start, attempts) VALUES (${userKey}, ${windowStart}, 1)
   ON CONFLICT (key, window_start) DO UPDATE SET attempts = login_attempts.attempts + 1 RETURNING attempts`,
  sql`DELETE FROM login_attempts WHERE window_start < now() - interval '1 day'`
 ]);
 return results[0][0].attempts <= 10 && results[1][0].attempts <= 20;
}

export async function startSession(userId, cookies) {
 const sql = database();
 const token = randomBytes(32).toString('base64url');
 const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
 const previous = cookies.get(SESSION_COOKIE);
 await sql.transaction([
  sql`DELETE FROM sessions WHERE expires_at <= now()`,
  // A fresh token replaces the incoming session instead of reusing a supplied token.
  sql`DELETE FROM sessions WHERE id = ${previous ? sessionId(previous) : ''}`,
  sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId(token)}, ${userId}, ${expiresAt.toISOString()})`
 ]);
 cookies.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt, maxAge: SESSION_SECONDS });
}

export async function endSession(cookies) {
 const token = cookies.get(SESSION_COOKIE);
 if (token) {
  const sql = database();
  await sql`DELETE FROM sessions WHERE id = ${sessionId(token)}`;
 }
 clearSessionCookie(cookies);
}
