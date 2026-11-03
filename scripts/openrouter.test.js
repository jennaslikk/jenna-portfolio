import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSummary, DEFAULT_SUMMARY_MODEL } from '../src/lib/server/openrouter.js';
import { generateProjectSummary } from '../src/lib/server/project-summary.js';

const project = { description: 'An illustrated launch animation for a new sweet.', context: 'A playful character introduces the product through expressive movement.' };
const summary = 'An illustrated launch animation introduces a new sweet through a playful character. Expressive movement brings the product presentation to life, combining a clear introduction with a light, engaging visual approach.';
const response = content => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content } }] }) });
const config = { apiKey: 'test-only-not-a-real-key' };

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
test('draft generation requires authentication and makes no database writes', async () => {
 let calls = 0;
 const options = { ...config, fetcher: async () => { calls += 1; return response(summary); } };
 await assert.rejects(generateProjectSummary(project, { ...options, locals: {} }), /Authentication required/);
 assert.equal(calls, 0);
 assert.equal(await generateProjectSummary(project, { ...options, locals: { user: { id: '1' } } }), summary);
 assert.equal(await generateProjectSummary(project, { ...options, locals: { user: { id: '1' } } }), summary);
 assert.equal(calls, 2, 'Each explicit generation is allowed, including regeneration');
});

test('reviewed summary validation preserves edits and rejects oversized/non-text input', async () => {
 const { validateProject } = await import('../src/lib/server/project-input.js');
 const input = new FormData();
 input.set('summary', '  My reviewed wording.  ');
 let checked = validateProject(input);
 assert.equal(checked.project.summary, 'My reviewed wording.');
 assert.equal(checked.errors.summary, undefined);
 input.set('summary', 'x'.repeat(2001));
 assert( validateProject(input).errors.summary );
 input.set('summary', new Blob(['text']), 'draft.txt');
 assert( validateProject(input).errors.summary );
 input.delete('summary');
 assert.equal(validateProject(input).project.summary, '');
});
