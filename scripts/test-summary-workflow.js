import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { completeProjectSummary } from '../src/lib/server/project-summary.js';

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
 for (const slug of [prefix, prefix + '-failed']) {
  await sql`INSERT INTO projects (slug, title, description, context, display_order, content)
   SELECT ${slug}, ${slug}, ${description}, ${context}, COALESCE(MAX(display_order), 0) + 1,
   '{"cover":"","createdViaStudio":true}'::jsonb FROM projects`;
 }
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
 phase = 'mocked generation and persistence';
 let calls = 0;
 const options = { locals, slug: prefix, project: { description, context }, apiKey: 'verification-only-not-a-real-key', connect: () => sql,
  fetcher: async () => { calls += 1; return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: summary } }] }) }; } };
 assert.equal(await completeProjectSummary(options), 'generated');
 assert.equal(await completeProjectSummary(options), 'skipped');
 assert.equal(calls, 1);
 const stored = await sql`SELECT summary, content FROM projects WHERE slug = ${prefix}`;
 assert.equal(stored[0].summary, summary);
 assert.equal(stored[0].content.summaryStatus, 'generated');
 for (const path of ['/studio?created=' + prefix, '/work/' + prefix, '/studio?created=' + prefix]) {
  const response = await fetch(origin + path, { headers: { cookie } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('Summary (AI-generated)'));
  assert(html.includes(summary));
  assert(!html.includes(options.apiKey));
 }
 assert.equal(calls, 1);
 console.log('PASS mocked summary stored in Neon and shown in studio/sidebar; refresh and repeat processing make no extra call');
 phase = 'AI failure';
 assert.equal(await completeProjectSummary({ ...options, slug: prefix + '-failed', fetcher: async () => { throw Error('Service unavailable'); } }), 'failed');
 const failed = await sql`SELECT description, context, summary, content FROM projects WHERE slug = ${prefix + '-failed'}`;
 assert.equal(failed[0].description, description);
 assert.equal(failed[0].context, context);
 assert.equal(failed[0].summary, null);
 assert.equal(failed[0].content.summaryStatus, 'failed');
 const failurePage = await fetch(origin + '/studio?created=' + prefix + '-failed', { headers: { cookie } });
 assert((await failurePage.text()).includes('Your project is saved, but its AI summary is unavailable.'));
 console.log('PASS failed AI preserves saved project and displays an honest notice');
 const unchanged = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects
  WHERE slug <> ${prefix} AND slug <> ${prefix + '-failed'} ORDER BY id`;
 assert.deepEqual(unchanged, baseline);
 console.log('PASS all existing project records unchanged; no real OpenRouter requests or charges');
} catch (error) {
 console.error(`FAIL summary workflow (${phase}):`, error.code || error.name);
 process.exitCode = 1;
} finally {
 await sql`DELETE FROM projects WHERE slug IN (${prefix}, ${prefix + '-failed'}) AND title IN (${prefix}, ${prefix + '-failed'})`;
 await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
 console.log('Temporary verification projects/session removed; administrator account unchanged.');
}
