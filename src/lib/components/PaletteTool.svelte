<script>
 import { enhance, applyAction } from '$app/forms';
 import { paletteModes } from '#lib/studio/palette-options';
 let { result } = $props();
 let localResult = $state(null);
 const paletteResult = $derived(localResult ?? result);
 const modeLabel = $derived(paletteModes.find(mode => mode.value === (paletteResult?.paletteMode || 'analogic'))?.label || 'Analogous');
 let generating = $state(false);
 let copyMessage = $state('');

 async function copyHex(hex) {
  try {
   await navigator.clipboard.writeText(hex);
   copyMessage = `Copied ${hex}`;
  } catch {
   copyMessage = `Copy is unavailable in this browser. Select and copy ${hex} manually.`;
  }
 }
</script>

<section class="palette-tool" id="palette" aria-labelledby="palette-title">
 <h2 class="label" id="palette-title">Colour palette</h2>
 <p>Enter a HEX colour to find its name and explore a colour scheme.</p>
 <form method="POST" action="?/generatePalette#palette" use:enhance={() => {
  generating = true;
  copyMessage = '';
  return async ({ result: response }) => {
   // Tool results stay local so exploring colours never resets the Add Project draft.
   try {
    if (response.type === 'success' || response.type === 'failure') localResult = response.data;
    else await applyAction(response);
   } finally { generating = false; }
  };
 }}>
  <label class="label" for="palette-hex">HEX colour</label>
  <input id="palette-hex" name="hex" type="text" required maxlength="7" placeholder="#DEC1DA" value={paletteResult?.paletteHex ?? '#DEC1DA'} autocapitalize="characters" spellcheck="false" aria-invalid={paletteResult?.paletteMessage ? 'true' : undefined} aria-describedby="palette-help" />
  <p class="hint" id="palette-help">Use 3 or 6 digits, with or without #.</p>
  <label class="label" for="palette-mode">Colour scheme</label>
  <select id="palette-mode" name="mode" value={paletteResult?.paletteMode || 'analogic'}>
   {#each paletteModes as mode}<option value={mode.value}>{mode.label}</option>{/each}
  </select>
  {#if paletteResult?.paletteMessage}<p class="error" role="alert">{paletteResult.paletteMessage}</p>{/if}
  <button class="button" type="submit" disabled={generating}>{generating ? 'Generating…' : 'Generate palette'}</button>
 </form>
 {#if paletteResult?.palette}
  <div class="palette-results">
   <h3 class="label">Seed colour</h3>
   <div class="color-card">
    <div class="swatch seed-swatch" style:background-color={paletteResult.palette.seed.hex} role="img" aria-label={`${paletteResult.palette.seed.name}, ${paletteResult.palette.seed.hex}`}></div>
    <p class="color-name">{paletteResult.palette.seed.name}</p>
    <code>{paletteResult.palette.seed.hex}</code>
    <button class="button outline copy-button" type="button" aria-label={`Copy ${paletteResult.palette.seed.hex}`} onclick={() => copyHex(paletteResult.palette.seed.hex)}>Copy HEX</button>
   </div>
   <h3 class="label">{modeLabel} palette</h3>
   <div class="swatch-grid">
    {#each paletteResult.palette.colors as color}
     <div class="color-card">
      <div class="swatch" style:background-color={color.hex} role="img" aria-label={`${color.name}, ${color.hex}`}></div>
      <p class="color-name">{color.name}</p>
      <code>{color.hex}</code>
      <button class="button outline copy-button" type="button" aria-label={`Copy ${color.hex}`} onclick={() => copyHex(color.hex)}>Copy HEX</button>
     </div>
    {/each}
   </div>
  </div>
 {/if}
 <p class="copy-status" role="status" aria-live="polite">{copyMessage}</p>
 <p class="attribution">Colour names and palettes from <a href="https://www.thecolorapi.com" target="_blank" rel="noopener noreferrer">The Color API</a>.</p>
</section>

<style>
 .palette-tool { scroll-margin-top: calc(var(--header) + 24px); }
 h2 { margin-bottom: 20px; }
 p { margin-bottom: 24px; }
 form { display: flex; flex-direction: column; align-items: flex-start; row-gap: 12px; }
 input, select { box-sizing: border-box; width: 100%; min-height: 44px; padding-top: 12px; padding-right: 14px; padding-bottom: 12px; padding-left: 14px; border-top-width: var(--hairline); border-right-width: var(--hairline); border-bottom-width: var(--hairline); border-left-width: var(--hairline); border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--line); border-right-color: var(--line); border-bottom-color: var(--line); border-left-color: var(--line); border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0; background-color: white; color: var(--ink); font-family: var(--sans); font-size: inherit; font-weight: 400; line-height: 1.3; }
 input[aria-invalid="true"] { background-color: var(--pink); }
 .hint, .error { margin-bottom: 0; font-size: var(--studio-caption-size, 15px); }
 .palette-results { margin-top: 32px; }
 h3 { margin-top: 24px; margin-bottom: 16px; }
 .swatch-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 24px; column-gap: 16px; }
 .color-card { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; row-gap: 10px; }
 .swatch { width: 100%; height: 80px; box-sizing: border-box; border-top-width: var(--hairline); border-right-width: var(--hairline); border-bottom-width: var(--hairline); border-left-width: var(--hairline); border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--line); border-right-color: var(--line); border-bottom-color: var(--line); border-left-color: var(--line); }
 .seed-swatch { height: 100px; }
 .color-name { margin-bottom: 0; overflow-wrap: anywhere; }
 code { font-family: var(--sans); font-size: inherit; user-select: all; }
 .copy-button { font-size: var(--studio-button-size, 13px); min-height: 36px; }
 .copy-status { margin-top: 16px; margin-bottom: 0; font-size: var(--studio-caption-size, 15px); overflow-wrap: anywhere; }
 .attribution { margin-top: 24px; margin-bottom: 0; font-size: var(--studio-caption-size, 14px); }
 .attribution a { text-decoration-line: underline; }
</style>
