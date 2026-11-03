import { validPaletteMode } from '../studio/palette-options.js';

export function normaliseHex(value) {
 if (typeof value !== 'string') return null;
 const hex = value.trim().replace(/^#/, '');
 if (!/^(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(hex)) return null;
 return (hex.length === 3 ? [...hex].map(character => character + character).join('') : hex).toUpperCase();
}

function readColor(value) {
 // Only validated colour values reach CSS; discard API URLs and unused metadata.
 if (!/^#[A-Fa-f0-9]{6}$/.test(value?.hex?.value) || typeof value?.name?.value !== 'string'
  || !value.name.value.trim() || value.name.value.length > 200) throw new Error('Invalid colour response');
 return { hex: value.hex.value.toUpperCase(), name: value.name.value.trim() };
}

export async function getPalette(hex, fetcher = fetch, timeoutMs = 8000, mode = 'analogic') {
 const clean = normaliseHex(hex);
 if (!validPaletteMode(mode)) throw new Error('Invalid palette mode');
 if (!clean) throw new Error('Invalid HEX colour');
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), timeoutMs);
 async function request(path, parameters) {
  // The host and paths are fixed: input cannot redirect the server to another site.
  const url = new URL(path, 'https://www.thecolorapi.com');
  url.search = new URLSearchParams({ hex: clean, format: 'json', ...parameters }).toString();
  const response = await fetcher(url, { signal: controller.signal, headers: { accept: 'application/json' }, redirect: 'error' });
  if (!response.ok) throw new Error('Colour service unavailable');
  return response.json();
 }
 try {
  const [color, scheme] = await Promise.all([request('/id', {}), request('/scheme', { mode, count: '5' })]);
  if (!Array.isArray(scheme.colors) || scheme.colors.length !== 5) throw new Error('Invalid palette response');
  return { seed: readColor(color), colors: scheme.colors.map(readColor) };
 } finally {
  clearTimeout(timer);
  controller.abort();
 }
}
