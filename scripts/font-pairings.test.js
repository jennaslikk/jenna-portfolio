import test from 'node:test';
import assert from 'node:assert/strict';
import { fonts, fontCategories, suggestPairings, googleFontLink, previewStylesheet } from '../src/lib/studio/font-pairings.js';

test('each category gives three distinct complementary pairs', () => {
 for (const { value: category } of fontCategories) {
  const pairs = suggestPairings(category);
  assert.equal(pairs.length, 3);
  assert.equal(new Set(pairs.map(pair => pair.heading.family + pair.body.family)).size, 3);
  for (const pair of pairs) {
   assert.equal(pair.heading.category, category);
   assert.equal(pair.body.category, category === 'sans-serif' ? 'serif' : 'sans-serif');
   assert.notEqual(pair.heading.family, pair.body.family);
  }
 }
});

test('selected headline stays fixed while refresh rotates body suggestions', () => {
 for (const font of fonts) {
  const first = suggestPairings(font.category, font.family);
  const refreshed = suggestPairings(font.category, font.family, 1);
  assert(refreshed.every(pair => pair.heading.family === font.family));
  assert.notDeepEqual(refreshed, first);
 }
});

test('unknown selections fall back safely; font URLs contain only allowed catalogue entries', () => {
 assert.deepEqual(suggestPairings('unknown', 'untrusted', -1), suggestPairings());
 const url = new URL(previewStylesheet(suggestPairings('serif', 'Lora')));
 assert.equal(url.origin, 'https://fonts.googleapis.com');
 assert.equal(url.pathname, '/css2');
 assert.equal(url.searchParams.getAll('family').length, 4);
 assert.equal(url.searchParams.get('display'), 'swap');
 assert.equal(googleFontLink('Playfair Display'), 'https://fonts.google.com/specimen/Playfair+Display');
 assert(!url.searchParams.has('key'));
});
