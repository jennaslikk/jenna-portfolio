// A small curated catalogue avoids a Developer API key or repeated metadata requests.
export const fontCategories = [
 { value: 'serif', label: 'Serif' },
 { value: 'sans-serif', label: 'Sans-serif' },
 { value: 'display', label: 'Display' }
];
export const fonts = [
 { family: 'Playfair Display', category: 'serif' },
 { family: 'Lora', category: 'serif' },
 { family: 'Libre Baskerville', category: 'serif' },
 { family: 'Source Serif 4', category: 'serif' },
 { family: 'Inter', category: 'sans-serif' },
 { family: 'DM Sans', category: 'sans-serif' },
 { family: 'Source Sans 3', category: 'sans-serif' },
 { family: 'Work Sans', category: 'sans-serif' },
 { family: 'Bodoni Moda', category: 'display' },
 { family: 'Abril Fatface', category: 'display' },
 { family: 'DM Serif Display', category: 'display' },
 { family: 'Prata', category: 'display' }
];

export function suggestPairings(category = 'serif', family = '', offset = 0) {
 const safeCategory = fontCategories.some(item => item.value === category) ? category : 'serif';
 const headings = fonts.filter(font => font.category === safeCategory);
 const selected = headings.find(font => font.family === family);
 // Contrast letter structures: serif + sans, sans + serif, display + quiet sans.
 const bodyCategory = safeCategory === 'sans-serif' ? 'serif' : 'sans-serif';
 const bodies = fonts.filter(font => font.category === bodyCategory);
 const start = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
 return Array.from({ length: 3 }, (_, index) => ({
  heading: selected || headings[(start + index) % headings.length],
  body: bodies[(start + index) % bodies.length]
 }));
}

export function googleFontLink(family) {
 return 'https://fonts.google.com/specimen/' + encodeURIComponent(family).replaceAll('%20', '+');
}

export function previewStylesheet(pairings) {
 // Only catalogue entries are allowed into the stylesheet URL or preview CSS.
 const families = [...new Set(pairings.flatMap(pair => [pair.heading.family, pair.body.family]))]
  .filter(family => fonts.some(font => font.family === family)).sort();
 const query = new URLSearchParams();
 for (const family of families) query.append('family', family + ':wght@400');
 query.set('display', 'swap');
 return 'https://fonts.googleapis.com/css2?' + query.toString();
}
