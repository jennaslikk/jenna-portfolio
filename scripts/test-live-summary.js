import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { parse } from 'devalue';
import { hasOpenRouterKey } from '../src/lib/server/openrouter.js';

// A real request can spend credits. Require an explicit flag and a local preview.
if (!process.argv.includes('--live')) throw new Error('Pass --live only after approving one real AI request and temporary database records.');
if (!hasOpenRouterKey(process.env.OPENROUTER_API_KEY)) throw new Error('Configure the real OpenRouter key privately before running this live test.');
const origin = process.env.LIVE_SUMMARY_TEST_ORIGIN || 'http://127.0.0.1:4173';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview.');
const sql = neon(process.env.DATABASE_URL);
const title = 'Live AI verification ' + randomBytes(12).toString('hex');
const token = randomBytes(32).toString('base64url');
const sessionId = createHash('sha256').update(token).digest('hex');
const cookie = `studio_session=${token}`;
let phase = 'setup';
let sessionCreated = false;
try {
 const baseline = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects ORDER BY id`;
 const users = await sql`SELECT id::text AS id FROM users ORDER BY id LIMIT 1`;
 assert(users.length, 'Create your administrator account first.');
 await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${users[0].id}, now() + interval '5 minutes')`;
 sessionCreated = true;
 phase = 'one authenticated create action';
 const values = {
  title, category: 'AI Creative', type: 'landscape', year: '2026', client: 'Course verification',
  description: 'A temporary demonstration project verifies authenticated portfolio publishing and reviewed AI text summaries.',
  context: 'Created only for an approved course verification test. It makes no claims about client work or design outcomes.',
  roles: 'Verification', tools: 'SvelteKit', body: 'Temporary verification content; this record is removed after the test.'
 };
 // Only the explicit draft action contacts OpenRouter; saving never generates.
 const generated = await fetch(origin + '/studio?/generateSummary', {
  method: 'POST', body: new URLSearchParams(values),
  headers: { origin, accept: 'application/json', 'x-sveltekit-action': 'true', cookie }
 });
 const result = await generated.json();
 assert.equal(result.type, 'success', 'The explicit generation action did not succeed.');
 values.summary = parse(result.data).values.summary;
 // Exactly one publishing POST: never automatically retry a possibly paid request.
 const saved = await fetch(origin + '/studio?/createProject', {
  method: 'POST', redirect: 'manual', body: new URLSearchParams(values),
  headers: { origin, accept: 'text/html', cookie }
 });
 assert.equal(saved.status, 303, 'The project action did not redirect after saving.');
 phase = 'real generation and Neon persistence';
 const rows = await sql`SELECT slug, summary, content FROM projects WHERE title = ${title}`;
 assert.equal(rows.length, 1);
 assert.equal(rows[0].content.summaryStatus, 'reviewed', 'A live summary was not generated. Check private configuration, model availability and provider credits before approving another attempt.');
 assert.equal(typeof rows[0].summary, 'string');
 assert(rows[0].summary.length >= 20);
 phase = 'studio and public rendering';
 for (const path of ['/studio?created=' + rows[0].slug, '/work/' + rows[0].slug, '/work/' + rows[0].slug]) {
  const response = await fetch(origin + path, { headers: { cookie } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('Summary (AI-generated)'));
  // Compare plain generated text through the stored value, without printing credentials.
  const escaped = rows[0].summary.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  assert(html.includes(escaped));
  for (const secret of [process.env.OPENROUTER_API_KEY, process.env.DATABASE_URL]) assert(!html.includes(secret));
 }
 const unchanged = await sql`SELECT id::text AS id, to_jsonb(projects) AS record FROM projects WHERE title <> ${title} ORDER BY id`;
 assert.deepEqual(unchanged, baseline);
 console.log('PASS one real OpenRouter summary generated through Studio, stored in Neon and rendered in studio/project pages; original projects unchanged.');
} catch (error) {
 console.error(`FAIL live summary verification (${phase}):`, error instanceof assert.AssertionError ? error.message : error.code || error.name);
 process.exitCode = 1;
} finally {
 // Remove only this run's randomly named project and session, never existing content.
 try {
  await sql`DELETE FROM projects WHERE title = ${title} AND content->>'createdViaStudio' = 'true'`;
  if (sessionCreated) await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
  console.log('Temporary live-verification project and session removed.');
 } catch {
  console.error('Temporary cleanup failed; inspect this test title before retrying:', title);
  process.exitCode = 1;
 }
}
