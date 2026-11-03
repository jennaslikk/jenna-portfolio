// These names map directly to The Color API's documented scheme modes.
export const paletteModes = [
 { value: 'analogic', label: 'Analogous' },
 { value: 'complement', label: 'Complementary' },
 { value: 'analogic-complement', label: 'Analogous + complementary' },
 { value: 'triad', label: 'Triadic' },
 { value: 'quad', label: 'Tetradic' },
 { value: 'monochrome', label: 'Monochrome' },
 { value: 'monochrome-dark', label: 'Monochrome dark' },
 { value: 'monochrome-light', label: 'Monochrome light' }
];
export function validPaletteMode(value) {
 return paletteModes.some(mode => mode.value === value);
}
