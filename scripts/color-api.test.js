import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseHex, getPalette } from '../src/lib/server/color-api.js';

const color = { hex: { value: '#DEC1DA' }, name: { value: 'Test pink' } };
const goodResponse = value => ({ ok: true, json: async () => value });

test('HEX validation expands shorthand and rejects invalid input', () => {
 assert.equal(normaliseHex(' #aBc '), 'AABBCC');
 assert.equal(normaliseHex('dec1da'), 'DEC1DA');
 for (const value of ['', null, 'GGGGGG', '#12345', '#12345678', 'https://example.com', 'red']) assert.equal(normaliseHex(value), null);
});
test('requests use fixed HTTPS endpoints and return only safe display data', async () => {
 const calls = [];
 const palette = await getPalette('DEC1DA', async (url, options) => {
  calls.push(url);
  assert.equal(url.origin, 'https://www.thecolorapi.com');
  assert.equal(url.searchParams.get('hex'), 'DEC1DA');
  assert.equal(options.redirect, 'error');
  return goodResponse(url.pathname === '/id' ? color : { colors: Array(5).fill(color) });
 });
 assert.equal(palette.seed.hex, '#DEC1DA');
 assert.equal(palette.colors.length, 5);
 assert.deepEqual(calls.map(url => url.pathname).sort(), ['/id', '/scheme']);
 assert.equal(calls.find(url => url.pathname === '/scheme').searchParams.get('mode'), 'analogic');
});
test('invalid input makes no external request', async () => {
 let calls = 0;
 await assert.rejects(getPalette('invalid', async () => { calls += 1; }));
 assert.equal(calls, 0);
});
test('HTTP errors, broken JSON and malformed palettes fail safely', async () => {
 await assert.rejects(getPalette('DEC1DA', async () => ({ ok: false })));
 await assert.rejects(getPalette('DEC1DA', async () => ({ ok: true, json: async () => { throw new Error('Broken JSON'); } })));
 await assert.rejects(getPalette('DEC1DA', async () => goodResponse({ colors: [] })));
 await assert.rejects(getPalette('DEC1DA', async url => goodResponse(url.pathname === '/id' ? { ...color, hex: { value: 'red;display:none' } } : { colors: Array(5).fill(color) })));
});
test('slow requests are aborted by the timeout', async () => {
 const stalled = (url, { signal }) => new Promise((resolve, reject) => {
  signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
 });
 await assert.rejects(getPalette('DEC1DA', stalled, 20));
});
