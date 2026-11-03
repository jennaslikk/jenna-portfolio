import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { generateProjectSummary } from '../src/lib/server/project-summary.js';

const origin = process.env.SUMMARY_TEST_ORIGIN || 'http://127.0.0.1:4179';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview.');
const sql = neon(process.env.DATABASE_URL);
const prefix = 'summary-check-' + randomBytes(10).toString('hex');
const token = randomBytes(32).toString('base64url');
const sessionId = createHash('sha256').update(token).digest('hex');
const cookie = `studio_session=${token}`;
const description = 'An illustrated campaign introduces a product through character animation.';
const context = 'Designed for a playful social launch, with clear product storytelling.';
const summary = 'An illustrated campaign introduces a product through playful character animation. Created for a social launch, the project combines expressive movement with clear product storytelling.';
let phase = 'setup';
let baseline;
try {
 const users = await sql`SELECT id::text AS id FROM users ORDER BY id LIMIT 1`;
 assert(users.length);
 const locals = { user: { id: users[0].id } };
 baseline = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects ORDER BY id`;
 await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${users[0].id}, now() + interval '5 minutes')`;
 phase = 'protected workflow';
 const denied = await fetch(origin + '/studio?/createProject', {
  method: 'POST', headers: { origin, accept: 'text/html' }, body: new URLSearchParams(), redirect: 'manual'
 });
 assert.equal(denied.status, 401);
 const invalid = await fetch(origin + '/studio?/createProject', {
  method: 'POST', headers: { origin, accept: 'text/html', cookie }, body: new URLSearchParams(), redirect: 'manual'
 });
 assert.equal(invalid.status, 400);
 console.log('PASS unauthenticated creation denied; invalid input rejected before AI processing');
 phase = 'explicit mocked drafts';
 let calls = 0;
 const options = { locals, apiKey: 'verification-only-not-a-real-key',
  fetcher: async () => { calls += 1; return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: summary } }] }) }; } };
 const draft = await generateProjectSummary({ description, context }, options);
 assert.equal(draft, summary);
 assert.equal(await generateProjectSummary({ description, context }, options), summary);
 assert.equal(calls, 2);
 assert.deepEqual(await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects ORDER BY id`, baseline);
 const deniedDraft = await fetch(origin + '/studio?/generateSummary', { method: 'POST', headers: { origin, accept: 'text/html' }, body: new URLSearchParams({ description, context }) });
 assert.equal(deniedDraft.status, 401, 'Guest draft status');
 const invalidDraft = await fetch(origin + '/studio?/generateSummary', { method: 'POST', headers: { origin, cookie, accept: 'text/html' }, body: new URLSearchParams({ description: '' }) });
 assert.equal(invalidDraft.status, 400, 'Invalid draft status');
 const forgedDraft = await fetch(origin + '/studio?/generateSummary', { method: 'POST', headers: { origin: 'https://untrusted.invalid', cookie }, body: new URLSearchParams({ description, context }) });
 assert.equal(forgedDraft.status, 403, 'Forged origin status');
 console.log('PASS explicit mocked generation/regeneration changes no database rows; guest, invalid and cross-origin requests denied');
 phase = 'reviewed persistence and no automatic generation';
 const edited = 'Reviewed wording: ' + draft;
 for (const [title, reviewed] of [[prefix, edited], [prefix + '-failed', '']]) {
  const result = await fetch(origin + '/studio?/createProject', {
   method: 'POST', redirect: 'manual', headers: { origin, cookie, accept: 'text/html' },
   body: new URLSearchParams({ title, category: 'AI Creative', type: 'landscape', description, context, summary: reviewed })
  });
  assert.equal(result.status, 303);
  const rows = await sql`SELECT summary, content FROM projects WHERE slug = ${title}`;
  assert.equal(rows[0].summary, reviewed || null);
  assert.equal(rows[0].content.summaryStatus, reviewed ? 'reviewed' : 'not_requested');
  for (const path of ['/studio?created=' + title, '/work/' + title, '/work/' + title]) {
   const page = await fetch(origin + path, { headers: { cookie } });
   assert.equal(page.status, 200);
   const html = await page.text();
   if (reviewed) assert(html.includes(edited));
   else if (path.startsWith('/studio')) assert(html.includes('Your project is saved without an AI summary.'));
  }
 }
 assert.equal(calls, 2);
 console.log('PASS edited draft stored in Neon and displayed after reload; blank summary publishes without AI');
 const unchanged = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects
  WHERE slug <> ${prefix} AND slug <> ${prefix + '-failed'} ORDER BY id`;
 assert.deepEqual(unchanged, baseline);
 console.log('PASS all existing project records unchanged; no real OpenRouter requests or charges');
} catch (error) {
 console.error(`FAIL summary workflow (${phase}):`, error.message?.slice(0, 240) || error.name);
 process.exitCode = 1;
} finally {
 await sql`DELETE FROM projects WHERE slug IN (${prefix}, ${prefix + '-failed'}) AND title IN (${prefix}, ${prefix + '-failed'})`;
 await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
 console.log('Temporary verification projects/session removed; administrator account unchanged.');
}
