import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const origin = process.env.COMMENTS_TEST_ORIGIN || 'http://127.0.0.1:4177';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview.');
const sql = neon(process.env.DATABASE_URL);
const token = randomBytes(32).toString('base64url');
const sessionId = createHash('sha256').update(token).digest('hex');
const cookie = `studio_session=${token}`;
const name = 'verify_' + randomBytes(12).toString('hex');
const first = `<script>alert("${name}")</script>`;
const second = `Newest ${name}: '); SELECT 1; --`;
let phase = 'setup';
let baseline;
async function submit(project, values = {}, authenticated = true, requestOrigin = origin) {
 return fetch(origin + '/studio?/addComment&project=' + encodeURIComponent(project), {
  method: 'POST', redirect: 'manual', headers: { origin: requestOrigin, accept: 'text/html', cookie: authenticated ? cookie : '' },
  body: new URLSearchParams({ project, name, message: first, ...values })
 });
}
async function page(slug, authenticated = true) {
 const response = await fetch(origin + '/studio?project=' + encodeURIComponent(slug), { headers: { cookie: authenticated ? cookie : '' } });
 assert.equal(response.status, 200);
 return response.text();
}
try {
 const users = await sql`SELECT id::text AS id FROM users ORDER BY id LIMIT 1`;
 assert(users.length);
 const projects = await sql`SELECT slug FROM projects ORDER BY display_order, id LIMIT 2`;
 assert.equal(projects.length, 2);
 const [project, other] = projects.map(project => project.slug);
 baseline = await sql`SELECT to_jsonb(comments) AS record FROM comments ORDER BY id`;
 await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${users[0].id}, now() + interval '5 minutes')`;
 phase = 'protection';
 assert(!(await page(project, false)).includes('action="?/addComment'));
 const anonymousData = await fetch(origin + '/studio/__data.json?project=' + encodeURIComponent(project));
 assert(!(await anonymousData.text()).includes('commentProjects'));
 assert.equal((await submit(project, {}, false)).status, 401);
 assert.equal((await submit(project, {}, true, 'https://untrusted.invalid')).status, 403);
 console.log('PASS comments are not loaded for guests; unauthenticated and cross-origin writes denied');
 phase = 'validation';
 for (const invalid of [{ name: '   ' }, { name: 'x'.repeat(81) }, { message: '' }, { message: 'x'.repeat(2001) }, { project: "' OR 1=1 --" }, { project: 'missing-' + name.replaceAll('_', '-') }]) {
  const response = await submit(project, invalid);
  assert.equal(response.status, 400);
 }
 assert.equal((await sql`SELECT id FROM comments WHERE display_name = ${name}`).length, 0);
 console.log('PASS required fields, length limits, invalid and nonexistent projects rejected without inserts');
 phase = 'saving';
 const savedFirst = await submit(project);
 assert.equal(savedFirst.status, 303);
 const savedSecond = await submit(project, { message: second });
 assert.equal(savedSecond.status, 303);
 const rows = await sql`SELECT id::text AS id, display_name, message FROM comments WHERE display_name = ${name} ORDER BY created_at DESC, id DESC`;
 assert.deepEqual(rows.map(row => row.message), [second, first]);
 console.log('PASS comments stored literally in Neon and retrieved newest first');
 phase = 'rendering and refresh';
 for (let refresh = 0; refresh < 2; refresh += 1) {
  const html = await page(project);
  assert(html.includes(name));
  assert(html.includes('&lt;script>'));
  assert(!html.includes('<script>alert('));
  assert(html.indexOf('Newest ' + name) < html.indexOf('&lt;script>'));
 }
 assert.equal((await sql`SELECT id FROM comments WHERE display_name = ${name}`).length, 2);
 assert(!(await page(other)).includes(name));
 const confirmation = await fetch(origin + savedSecond.headers.get('location'), { headers: { cookie } });
 assert((await confirmation.text()).includes('Comment saved.'));
 for (const path of ['/', '/work', '/work/' + project]) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200);
  assert(!(await response.text()).includes(name));
 }
 console.log('PASS refresh persistence, escaping, project separation, confirmation and no public comment exposure');
 const current = await sql`SELECT to_jsonb(comments) AS record FROM comments WHERE display_name <> ${name} ORDER BY id`;
 assert.deepEqual(current, baseline);
 console.log('PASS all pre-existing comments unchanged');
 phase = 'deletion';
 async function remove(id, slug = project, authenticated = true, requestOrigin = origin) {
  return fetch(origin + '/studio?/deleteComment&project=' + encodeURIComponent(slug), {
   method: 'POST', redirect: 'manual', headers: { origin: requestOrigin, accept: 'text/html', cookie: authenticated ? cookie : '' },
   body: new URLSearchParams({ commentId: id, project: slug })
  });
 }
 assert((await page(project)).includes('Project:'));
 assert.equal((await remove(rows[1].id, project, false)).status, 401);
 assert.equal((await remove(rows[1].id, project, true, 'https://untrusted.invalid')).status, 403);
 assert.equal((await remove('invalid')).status, 400);
 assert.equal((await remove(rows[1].id, other)).status, 404);
 assert.equal((await sql`SELECT id FROM comments WHERE display_name = ${name}`).length, 2);
 const deleted = await remove(rows[1].id);
 assert.equal(deleted.status, 303);
 const noticeCookie = deleted.headers.get('set-cookie').split(';')[0];
 const notice = await fetch(origin + deleted.headers.get('location'), { headers: { cookie: cookie + '; ' + noticeCookie } });
 assert((await notice.text()).includes('Comment deleted.'));
 assert.match(notice.headers.get('set-cookie'), /Max-Age=0/i);
 assert(!(await page(project)).includes('Comment deleted.'));
 assert.equal((await sql`SELECT id FROM comments WHERE id = ${rows[1].id}`).length, 0);
 assert.equal((await sql`SELECT id FROM comments WHERE id = ${rows[0].id}`).length, 1);
 assert(!(await page(project)).includes('&lt;script>'));
 console.log('PASS project label; authenticated deletion persists; other comments and projects protected');
} catch (error) {
 console.error(`FAIL comments verification (${phase}):`, error.code || error.name);
 process.exitCode = 1;
} finally {
 await sql`DELETE FROM comments WHERE display_name = ${name} AND message IN (${first}, ${second})`;
 await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
 console.log('Temporary comments and session removed; no account created or changed.');
}
