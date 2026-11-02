import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../src/lib/server/passwords.js';

const origin = process.env.AUTH_TEST_ORIGIN || 'http://127.0.0.1:4173';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Authentication checks must target a local preview.');
const sql = neon(process.env.DATABASE_URL);
const username = 'verify_' + randomBytes(12).toString('hex');
const password = randomBytes(24).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('hex');
let userId;
const userKey = digest('username:' + username);
const unknownUsername = 'missing_' + randomBytes(10).toString('hex');
const loginCounts = new Map();

async function page(cookie = '') {
 const response = await fetch(origin + '/studio', { headers: { cookie } });
 const html = await response.text();
 assert.equal(response.status, 200);
 assert.match(response.headers.get('cache-control'), /no-store/);
 assert.match(response.headers.get('x-robots-tag'), /noindex/);
 assert.equal(response.headers.get('referrer-policy'), 'same-origin');
 assert(!html.includes(password));
 assert(!html.includes(process.env.DATABASE_URL));
 assert(!html.includes('password_hash'));
 return html;
}
async function post(action, values = {}, cookie = '', requestOrigin = origin) {
 const window = new Date(Math.floor(Date.now() / 900000) * 900000).toISOString();
 const response = await fetch(origin + '/studio?/' + action, {
  method: 'POST', redirect: 'manual',
  headers: { origin: requestOrigin, cookie, accept: 'text/html' }, body: new URLSearchParams(values)
 });
 if (action === 'login' && requestOrigin === origin && response.status !== 403) loginCounts.set(window, (loginCounts.get(window) || 0) + 1);
 return response;
}
function cookieFrom(response) {
 const header = response.headers.get('set-cookie') || '';
 assert.match(header, /HttpOnly/i);
 assert.match(header, /Secure/i);
 assert.match(header, /SameSite=Lax/i);
 assert.match(header, /Max-Age=43200/i);
 return header.split(';')[0];
}

try {
 const hash = await hashPassword(password);
 const created = await sql`INSERT INTO users (username, password_hash) VALUES (${username}, ${hash}) RETURNING id::text AS id`;
 userId = created[0].id;
 assert((await page()).includes('action="?/login"'));
 assert(!(await page()).includes('Signed in as'));
 console.log('PASS anonymous studio: sign-in only; no-store/noindex; no secrets');
 assert.equal((await post('logout')).status, 401);
 assert.equal((await post('login', { username, password }, '', 'https://untrusted.invalid')).status, 403);
 assert.equal((await post('login', {}, '', 'null')).status, 403);
 const noOrigin = await fetch(origin + '/studio?/login', {
  method: 'POST', headers: { accept: 'text/html', referer: origin + '/studio' },
  body: new URLSearchParams(), redirect: 'manual'
 });
 assert.equal(noOrigin.status, 403);
 console.log('PASS logged-out protected action denied; cross-origin login denied');
 const wrong = await post('login', { username, password: randomBytes(24).toString('hex') });
 const unknown = await post('login', { username: unknownUsername, password });
 assert.equal(wrong.status, 400);
 assert.equal(unknown.status, 400);
 assert((await wrong.text()).includes('The username or password is incorrect.'));
 assert((await unknown.text()).includes('The username or password is incorrect.'));
 console.log('PASS incorrect password and unknown username return generic errors');
 const login = await post('login', { username, password });
 assert.equal(login.status, 303);
 let cookie = cookieFrom(login);
 const token = cookie.split('=')[1];
 const sessions = await sql`SELECT id, expires_at FROM sessions WHERE user_id = ${userId}`;
 assert.equal(sessions.length, 1);
 assert.equal(sessions[0].id, digest(token));
 assert.notEqual(sessions[0].id, token);
 assert((await page(cookie)).includes('Signed in as ' + username));
 assert((await page(cookie)).includes('action="?/logout"'));
 console.log('PASS login, secure cookie flags, hashed session storage, reload persistence');
 assert.equal((await post('logout', {}, cookie, 'https://untrusted.invalid')).status, 403);
 assert(!(await page('studio_session=' + randomBytes(32).toString('base64url'))).includes('Signed in as'));
 console.log('PASS cross-origin logout rejected; forged session denied');
 const logout = await post('logout', {}, cookie);
 assert.equal(logout.status, 303);
 assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
 assert.equal((await sql`SELECT id FROM sessions WHERE user_id = ${userId}`).length, 0);
 assert(!(await page(cookie)).includes('Signed in as'));
 console.log('PASS logout deletes database session; replayed cookie denied');
 const loginAgain = await post('login', { username, password });
 assert.equal(loginAgain.status, 303);
 cookie = cookieFrom(loginAgain);
 assert.notEqual(cookie.split('=')[1], token);
 await sql`UPDATE sessions SET expires_at = now() - interval '1 second' WHERE user_id = ${userId}`;
 assert(!(await page(cookie)).includes('Signed in as'));
 console.log('PASS new login rotates token; expired session denied');
 const window = new Date(Math.floor(Date.now() / 900000) * 900000).toISOString();
 await sql`INSERT INTO login_attempts (key, window_start, attempts) VALUES (${userKey}, ${window}, 20)
  ON CONFLICT (key, window_start) DO UPDATE SET attempts = 20`;
 assert.equal((await post('login', { username, password })).status, 429);
 console.log('PASS database-backed login throttling');
 for (const path of ['/', '/work', '/work/fruity-pigs', '/work/project-01', '/work/project-03', '/work/daybreak-distillery', '/work/project-05']) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200);
  assert(!(await response.text()).includes('href="/studio"'));
 }
 console.log('PASS public portfolio routes remain available and do not link to studio');
} catch (error) {
 console.error('FAIL authentication verification:', error.code || error.name);
 process.exitCode = 1;
} finally {
 // This run removes only its own randomly named test account and account counter.
 if (userId) await sql`DELETE FROM users WHERE id = ${userId} AND username = ${username}`;
 await sql`DELETE FROM login_attempts WHERE key = ${userKey} OR key = ${digest('username:' + unknownUsername)}`;
 // Subtract only this run's attempts from the local IPv4 test client's counter.
 if (new URL(origin).hostname === '127.0.0.1') {
  for (const [window, attempts] of loginCounts) {
   await sql`UPDATE login_attempts SET attempts = GREATEST(0, attempts - ${attempts})
    WHERE key = ${digest('ip:127.0.0.1')} AND window_start = ${window}`;
  }
 }
 console.log('Temporary verification account removed; no administrator account was created.');
}
