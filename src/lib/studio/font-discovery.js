import { discoveryFonts } from './font-catalogue.js';

// Original lines written for this feature, never attributed to historical figures.
export const studioQuotes = [
 'Make room for the unexpected.',
 'Let the quiet details speak.',
 'A small idea can change shape.',
 'Follow the line that surprises you.',
 'Leave a little space for wonder.',
 'Give curiosity a place to land.',
 'Find a rhythm, then interrupt it.',
 'Let rough edges start a conversation.',
 'Try a softer kind of bold.',
 'Make something that asks a question.',
 'A new perspective begins with noticing.',
 'Keep one corner open to play.',
 'Let the first mark lead somewhere new.'
];

export function stockholmDate(date = new Date()) {
 const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit'
 }).formatToParts(date);
 const part = name => parts.find(item => item.type === name).value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dailyPairing(dateKey, offset = 0) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Invalid daily date');
 const [year, month, day] = dateKey.split('-').map(Number);
 const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
 const position = dayNumber + (Number.isSafeInteger(offset) && offset >= 0 ? offset : 0);
 const modulo = (value, count) => ((value % count) + count) % count;
 // Separate cycles: fonts repeat after 12 days, quotes after 13; exact pairs after 156.
 return {
  font: discoveryFonts[modulo(position, discoveryFonts.length)],
  quote: studioQuotes[modulo(position * 5 + 7, studioQuotes.length)]
 };
}

export function nextDiscovery(offset) {
 // Skip the official daily pairing when a complete exploration cycle wraps around.
 return (offset + 1) % (discoveryFonts.length * studioQuotes.length) || 1;
}

const loadedFonts = new Map();
export function loadDiscoveryFont(font) {
 if (typeof FontFace === 'undefined') return Promise.reject(new Error('Font previews unavailable'));
 // A licence and a pinned source are mandatory before a live preview is attempted.
 if (font.license !== 'OFL-1.1' || !font.fontUrl) return Promise.reject(new Error('Specimen link only'));
 if (!loadedFonts.has(font.id)) {
  const face = new FontFace(`StudioDiscovery-${font.id}`, `url("${font.fontUrl}")`, { weight: String(font.weight), style: 'normal' });
  loadedFonts.set(font.id, face.load().then(loaded => {
   document.fonts.add(loaded);
   return loaded.family;
  }).catch(error => {
   loadedFonts.delete(font.id);
   throw error;
  }));
 }
 return loadedFonts.get(font.id);
}
