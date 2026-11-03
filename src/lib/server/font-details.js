import { discoveryFonts } from '../studio/font-catalogue.js';

const cachedDetails = new Map();
const CACHE_MS = 24 * 60 * 60 * 1000;

export async function getFontDetails(id, fetcher = fetch, { cache = cachedDetails, timeoutMs = 8000, now = Date.now } = {}) {
 // Only our verified Fontsource entries may be requested; user input is never a URL.
 const font = discoveryFonts.find(item => item.id === id && item.metadataUrl === `https://api.fontsource.org/v1/fonts/${item.id}`);
 if (!font) throw new Error('Choose a Fontsource typeface from the collection.');
 const existing = cache.get(id);
 if (existing && existing.expires > now()) return existing.value;
 const response = await fetcher(`https://api.fontsource.org/v1/fonts/${font.id}`, {
  headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(timeoutMs)
 });
 if (!response.ok) throw new Error('Fontsource is temporarily unavailable.');
 const data = await response.json();
 if (data.id !== font.id || data.family !== font.name || data.license !== 'OFL-1.1'
  || !Array.isArray(data.weights) || !data.weights.length || data.weights.length > 100
  || data.weights.some(weight => !Number.isInteger(weight) || weight < 1 || weight > 1000)
  || !Array.isArray(data.styles) || data.styles.length > 10 || data.styles.some(style => !['normal', 'italic', 'oblique'].includes(style))
  || !Array.isArray(data.subsets) || data.subsets.length > 100 || data.subsets.some(subset => typeof subset !== 'string' || !/^[a-z0-9-]{1,40}$/.test(subset))
  || typeof data.version !== 'string' || data.version.length > 40) throw new Error('Fontsource returned unexpected font details.');
 // Keep only useful public facts, never remote CSS, font URLs or arbitrary metadata.
 const details = { id: font.id, family: data.family, weights: data.weights, styles: data.styles, subsets: data.subsets, version: data.version };
 cache.set(id, { expires: now() + CACHE_MS, value: details });
 return details;
}
