import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryFonts } from '../src/lib/studio/font-catalogue.js';
import { stockholmDate, dailyPairing, nextDiscovery, studioQuotes } from '../src/lib/studio/font-discovery.js';

test('Stockholm dates follow local midnight in winter, summer and DST transitions', () => {
 for (const [instant, expected] of [
  ['2026-11-03T22:59:59Z', '2026-11-03'], ['2026-11-03T23:00:00Z', '2026-11-04'],
  ['2026-07-01T21:59:59Z', '2026-07-01'], ['2026-07-01T22:00:00Z', '2026-07-02'],
  ['2026-03-29T00:59:59Z', '2026-03-29'], ['2026-03-29T01:00:00Z', '2026-03-29'],
  ['2026-10-25T00:59:59Z', '2026-10-25'], ['2026-10-25T01:00:00Z', '2026-10-25']
 ]) assert.equal(stockholmDate(new Date(instant)), expected);
});

test('daily selection is stable, rotates both parts, and has no font repeats within 12 days', () => {
 const fontIds = new Set(), quotes = new Set();
 for (let day = 1; day <= discoveryFonts.length; day++) {
  const date = `2026-11-${String(day).padStart(2, '0')}`;
  const pair = dailyPairing(date);
  assert.deepEqual(dailyPairing(date), pair);
  fontIds.add(pair.font.id); quotes.add(pair.quote);
 }
 assert.equal(fontIds.size, discoveryFonts.length);
 assert.equal(quotes.size, discoveryFonts.length);
 assert.equal(studioQuotes.length, 13);
});

test('discover changes font and quote, never mutates today, and skips today on wrap', () => {
 const today = dailyPairing('2026-11-03');
 let offset = 0;
 for (let step = 0; step < 320; step++) {
  const before = dailyPairing('2026-11-03', offset);
  offset = nextDiscovery(offset);
  const another = dailyPairing('2026-11-03', offset);
  assert.notEqual(another.font.id, before.font.id);
  assert.notEqual(another.quote, before.quote);
  assert.notDeepEqual(another, today);
 }
 assert.deepEqual(dailyPairing('2026-11-03'), today);
});

test('every live font has a pinned HTTPS file, verified credit, licence and official source', () => {
 assert.equal(discoveryFonts.length, 12);
 for (const font of discoveryFonts) {
  assert.equal(font.license, 'OFL-1.1');
  assert(font.designer && font.classification && font.description);
  assert.match(font.fontUrl, /^https:\/\/cdn\.jsdelivr\.net\//);
  assert.match(font.fontUrl, /@[a-f0-9.]+\//);
  assert.match(font.fontUrl, /\.woff2$/);
  assert(font.licenseUrl.startsWith('https://'));
  assert(font.metadataUrl.startsWith('https://'));
  assert(font.officialUrl.startsWith('https://'));
 }
 assert(discoveryFonts.some(font => font.fontUrl.includes('/gh/velvetyne/')));
 assert(discoveryFonts.some(font => font.officialUrl.includes('theleagueofmoveabletype')));
});
