import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const origin = process.env.PROJECT_TEST_ORIGIN || 'http://127.0.0.1:4176';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview for project verification.');
const sql = neon(process.env.DATABASE_URL);
const token = randomBytes(32).toString('base64url');
const sessionId = createHash('sha256').update(token).digest('hex');
const cookie = `studio_session=${token}`;
const title = 'Studio verification ' + randomBytes(12).toString('hex');
let phase = 'setup';
let originalRows;
const values = {
 title, category: ['Illustration', 'AI Creative'], type: 'portrait', year: '2026', client: 'Verification client',
 description: "A parameterised description: '); SELECT 1; --",
 context: 'Project context', roles: 'Art direction\nIllustration', tools: 'Procreate\nAfter Effects',
 body: 'First paragraph.\n<script>alert("must remain text")</script>'
};
async function submit(input, authenticated = true, requestOrigin = origin) {
 return fetch(origin + '/studio?/createProject', {
  method: 'POST', redirect: 'manual', body: new URLSearchParams(Object.entries(input).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map(item => [key, item]))),
  headers: { origin: requestOrigin, accept: 'text/html', cookie: authenticated ? cookie : '' }
 });
}
try {
 originalRows = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects ORDER BY id`;
 const users = await sql`SELECT id::text AS id FROM users ORDER BY id LIMIT 1`;
 assert(users.length, 'Create your administrator account before running this verification.');
 // Use a short-lived session for an existing user; never read or change their password.
 await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${users[0].id}, now() + interval '5 minutes')`;
 phase = 'access checks';
 const anonymous = await fetch(origin + '/studio');
 assert(!(await anonymous.text()).includes('action="?/createProject"'));
 assert.equal((await submit(values, false)).status, 401);
 assert.equal((await submit(values, true, 'https://untrusted.invalid')).status, 403);
 const signed = await fetch(origin + '/studio', { headers: { cookie } });
 const form = await signed.text();
 assert(form.includes('action="?/createProject"'));
 assert(form.indexOf('action="?/logout"') < form.indexOf('action="?/createProject"'));
 console.log('PASS form follows sign-out; logged-out and cross-origin writes blocked');
 phase = 'invalid input';
 for (const [field, invalid] of [['title', ''], ['category', 'invalid'], ['type', 'invalid'], ['year', '26'], ['description', 'x'.repeat(501)], ['title', 'Berry Lovely']]) {
  const response = await submit({ ...values, [field]: invalid });
  assert.equal(response.status, 400);
  const html = await response.text();
  assert(html.includes('Please check the highlighted fields.'));
  assert(html.includes('Verification client'));
 }
 assert.equal((await sql`SELECT id FROM projects WHERE title = ${title}`).length, 0);
 console.log('PASS validation rejects bad input without saving; form text retained');
 phase = 'concurrent save';
 const responses = await Promise.all([submit(values), submit(values)]);
 for (const response of responses) assert.equal(response.status, 303);
 const rows = await sql`SELECT * FROM projects WHERE title = ${title} ORDER BY id`;
 assert.equal(rows.length, 2);
 assert.notEqual(rows[0].slug, rows[1].slug);
 assert(rows.some(row => row.slug.endsWith('-2')));
 for (const row of rows) {
  assert.equal(row.description, values.description);
  assert.equal(row.body, values.body);
  assert.deepEqual(row.roles, ['Art direction', 'Illustration']);
  assert.deepEqual(row.tools, ['Procreate', 'After Effects']);
  assert.deepEqual(row.category, ['Illustration', 'AI Creative']);
  assert.equal(row.summary, null);
  assert.equal(row.content.cover, '');
  assert(row.display_order >= Math.max(...originalRows.map(row => row.record.display_order)) + 1);
 }
 console.log('PASS concurrent saves allocate unique slugs; all fields persist; summary remains empty');
 phase = 'public rendering';
 const work = await fetch(origin + '/work');
 assert.equal(work.status, 200);
 const workHtml = await work.text();
 assert(workHtml.includes(title));
 for (const row of rows) {
  const response = await fetch(origin + '/work/' + row.slug);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('Project context'));
  assert(html.includes('Art direction'));
  assert(html.includes('First paragraph.'));
  assert(html.includes('&lt;script>'));
  assert(!html.includes('<script>alert('));
 }
 for (const response of responses) {
  const confirmation = await fetch(origin + response.headers.get('location'), { headers: { cookie } });
  assert.equal(confirmation.status, 200);
  assert((await confirmation.text()).includes('Project saved:'));
 }
 assert.equal((await sql`SELECT id FROM projects WHERE title = ${title}`).length, 2);
 console.log('PASS Work and new project pages show saved content, escape HTML, and refresh does not resubmit');
 phase = 'original record comparison';
 const current = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects WHERE title <> ${title} ORDER BY id`;
 assert.deepEqual(current, originalRows);
 console.log('PASS every original project record is unchanged');
} catch (error) {
 console.error(`FAIL project verification (${phase}):`, error.code || error.name);
 process.exitCode = 1;
} finally {
 // Only this run's unique test title and session hash are removed.
 await sql`DELETE FROM projects WHERE title = ${title} AND content->>'createdViaStudio' = 'true'`;
 await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
 console.log('Temporary projects and verification session removed; administrator account unchanged.');
}
