<script>
 import { fonts, fontCategories, suggestPairings, googleFontLink, previewStylesheet } from '#lib/studio/font-pairings';
 let category = $state('serif');
 let family = $state('');
 let offset = $state(0);
 const availableFonts = $derived(fonts.filter(font => font.category === category));
 const pairings = $derived(suggestPairings(category, family, offset));
 const stylesheet = $derived(previewStylesheet(pairings));
</script>

<!-- This component is mounted only inside the authenticated Studio branch. -->
<svelte:head><link rel="stylesheet" href={stylesheet} /></svelte:head>

<section class="font-tool" id="font-pairing" aria-labelledby="font-pairing-title">
 <h2 class="label" id="font-pairing-title">Font pairing</h2>
 <p class="intro">Explore contrasting typefaces from a curated Google Fonts selection.</p>
 <div class="controls">
  <label class="label" for="font-category">Headline category</label>
  <select id="font-category" bind:value={category} onchange={() => { family = ''; offset = 0; }}>
   {#each fontCategories as item}<option value={item.value}>{item.label}</option>{/each}
  </select>
  <label class="label" for="font-family">Headline font</label>
  <select id="font-family" bind:value={family} onchange={() => { offset = 0; }}>
   <option value="">Explore this category</option>
   {#each availableFonts as font}<option value={font.family}>{font.family}</option>{/each}
  </select>
  <button class="button" type="button" onclick={() => { offset += 1; }}>Refresh pairings</button>
 </div>
 <p class="hint rule">{category === 'sans-serif' ? 'Rule: a clean sans-serif headline with a serif body for contrast.' : category === 'display' ? 'Rule: an expressive display headline with a restrained sans-serif body.' : 'Rule: a serif headline with a sans-serif body for contrast.'} These are design starting points, not AI recommendations.</p>
 <div class="pairings" aria-live="polite" aria-atomic="true">
  {#each pairings as pairing}
   <article class="pairing" aria-label={`${pairing.heading.family} with ${pairing.body.family}`}>
    <p class="font-names"><a href={googleFontLink(pairing.heading.family)} target="_blank" rel="noopener noreferrer">{pairing.heading.family}</a> + <a href={googleFontLink(pairing.body.family)} target="_blank" rel="noopener noreferrer">{pairing.body.family}</a></p>
    <div class="preview">
     <p class="preview-heading" style:font-family={`"${pairing.heading.family}", ${pairing.heading.category === 'sans-serif' ? 'sans-serif' : 'serif'}`}>Ideas take shape.</p>
     <p class="preview-body" style:font-family={`"${pairing.body.family}", ${pairing.body.category}`}>Thoughtful design brings clarity, character, and a fresh perspective to everyday stories.</p>
    </div>
   </article>
  {/each}
 </div>
 <p class="hint">Preview fonts load from Google Fonts. If offline, fallback fonts appear. The Studio interface keeps its original typefaces.</p>
 <noscript><p class="hint">Enable JavaScript to change or refresh pairings.</p></noscript>
</section>

<style>
 .font-tool{margin-top:32px;padding-top:32px;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
 h2{margin-bottom:20px;}
 .intro{margin-bottom:24px;}
 .controls{display:flex;flex-direction:column;align-items:flex-start;row-gap:12px;}
 select{width:100%;min-width:0;min-height:44px;padding-top:12px;padding-right:14px;padding-bottom:12px;padding-left:14px;border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0;background-color:#fff;color:var(--ink);font-family:var(--sans);font-size:inherit;line-height:1.3;}
 .hint,.font-names{font-size:var(--studio-caption-size,15px);line-height:1.4;}
 .rule{margin-top:20px;margin-bottom:0;}
 .pairings{margin-top:24px;margin-bottom:24px;}
 .pairing{padding-top:20px;padding-bottom:20px;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
 .font-names{margin-bottom:16px;overflow-wrap:anywhere;}
 a{text-decoration-line:underline;text-underline-offset:3px;}
 /* Candidate fonts are confined to these two preview lines. */
 .preview .preview-heading{font-size:30px;font-weight:400;line-height:1.2;letter-spacing:0;text-transform:none;margin-bottom:12px;overflow-wrap:anywhere;}
 .preview .preview-body{font-size:16px;font-weight:400;line-height:1.5;letter-spacing:0;text-transform:none;margin-bottom:0;}
</style>
