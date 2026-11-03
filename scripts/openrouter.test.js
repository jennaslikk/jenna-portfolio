import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSummary, DEFAULT_SUMMARY_MODEL } from '../src/lib/server/openrouter.js';
import { completeProjectSummary } from '../src/lib/server/project-summary.js';

const project = { description: 'An illustrated launch animation for a new sweet.', context: 'A playful character introduces the product through expressive movement.' };
const summary = 'An illustrated launch animation introduces a new sweet through a playful character. Expressive movement brings the product presentation to life, combining a clear introduction with a light, engaging visual approach.';
const response = content => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content } }] }) });
const config = { apiKey: 'test-only-not-a-real-key' };

function fakeDatabase() {
 let claimed = false;
 const saved = [];
 return { saved, connect: () => async (strings, ...values) => {
  if (strings.join('').includes('RETURNING id')) {
   if (claimed) return [];
   claimed = true;
   return [{ id: '1' }];
  }
  saved.push(values);
  return [];
 } };
}

test('summary request limits cost and sends only description/context', async () => {
 let calls = 0;
 const result = await generateSummary({ ...project, body: 'Do not send body', client: 'Do not send client' }, { ...config, fetcher: async (url, options) => {
  calls += 1;
  assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(options.headers.authorization, 'Bearer test-only-not-a-real-key');
  const body = JSON.parse(options.body);
  assert.equal(body.model, DEFAULT_SUMMARY_MODEL);
  assert.equal(body.max_tokens, 160);
  assert.equal(body.provider.allow_fallbacks, false);
  assert.deepEqual(JSON.parse(body.messages[1].content), project);
  return response(summary);
 } });
 assert.equal(result, summary);
 assert.equal(calls, 1);
});
test('missing key and invalid inputs make no request', async () => {
 let calls = 0;
 const fetcher = async () => { calls += 1; };
 await assert.rejects(generateSummary(project, { apiKey: '', fetcher }));
 await assert.rejects(generateSummary({ ...project, description: '' }, { ...config, fetcher }));
 await assert.rejects(generateSummary({ ...project, context: 'x'.repeat(5001) }, { ...config, fetcher }));
 assert.equal(calls, 0);
});
test('HTTP failures, invalid JSON and unsafe/truncated output are rejected without retry', async () => {
 let calls = 0;
 await assert.rejects(generateSummary(project, { ...config, fetcher: async () => { calls += 1; return { ok: false }; } }));
 assert.equal(calls, 1);
 for (const text of ['', 'short', '<script>malicious content must not be stored</script>', 'x'.repeat(601)]) {
  await assert.rejects(generateSummary(project, { ...config, fetcher: async () => response(text) }));
 }
 await assert.rejects(generateSummary(project, { ...config, fetcher: async () => ({ ok: true, json: async () => { throw Error(); } }) }));
 await assert.rejects(generateSummary(project, { ...config, fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'length', message: { content: summary } }] }) }) }));
});
test('timeout aborts the request', async () => {
 await assert.rejects(generateSummary(project, { ...config, timeoutMs: 20, fetcher: (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Error('Aborted')), { once: true })) }));
});
test('authentication is checked before database or API access', async () => {
 await assert.rejects(completeProjectSummary({ locals: {}, connect: () => { throw Error('Must not connect'); } }), /Authentication required/);
});
test('atomic claim permits one request even with concurrent processing', async () => {
 const db = fakeDatabase();
 let calls = 0;
 const options = { locals: { user: { id: '1' } }, slug: 'test', project, ...config, connect: db.connect, fetcher: async () => { calls += 1; return response(summary); } };
 const states = await Promise.all([completeProjectSummary(options), completeProjectSummary(options)]);
 assert.deepEqual(states.sort(), ['generated', 'skipped']);
 assert.equal(calls, 1);
 assert.equal(db.saved[0][0], summary);
 assert.equal(db.saved[0][1], 'generated');
});
test('unavailable service and missing key store honest status and no invented summary', async () => {
 for (const apiKey of ['', config.apiKey]) {
  const db = fakeDatabase();
  const status = await completeProjectSummary({ locals: { user: { id: '1' } }, slug: 'test', project, apiKey, connect: db.connect, fetcher: async () => { throw Error('Unavailable'); } });
  assert.equal(status, apiKey ? 'failed' : 'not_configured');
  assert.equal(db.saved[0][0], null);
 }
});
