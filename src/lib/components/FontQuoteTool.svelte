<script>
 import { enhance, applyAction } from '$app/forms';
 import { onMount, tick } from 'svelte';
 import { stockholmDate, dailyPairing, nextDiscovery, loadDiscoveryFont } from '#lib/studio/font-discovery';
 let { result } = $props();
 let detailsByFont = $state({});
 let metadataForm = $state();
 let day = $state(stockholmDate());
 let offset = $state(0);
 let loadState = $state('loading');
 let previewFamily = $state('');
 let quoteElement = $state();
 const pairing = $derived(dailyPairing(day, offset));
 const supportsDetails = $derived(pairing.font.metadataUrl.startsWith('https://api.fontsource.org/'));
 const fontResult = $derived(detailsByFont[pairing.font.id] || (result?.fontDetails?.id === pairing.font.id ? result : null));

 // Preserve whole words, shrinking only when a word cannot fit the specimen width.
 $effect(() => {
  const element = quoteElement;
  const words = pairing.quote.split(/\s+/);
  previewFamily;
  if (!element) return;
  const fitWords = () => {
   element.style.fontSize = '';
   const style = getComputedStyle(element);
   const measure = document.createElement('span');
   measure.style.position = 'absolute';
   measure.style.visibility = 'hidden';
   measure.style.whiteSpace = 'nowrap';
   measure.style.fontFamily = style.fontFamily;
   measure.style.fontWeight = style.fontWeight;
   measure.style.fontSize = style.fontSize;
   measure.style.letterSpacing = style.letterSpacing;
   element.append(measure);
   let longest = 0;
   for (const word of words) {
    measure.textContent = word;
    longest = Math.max(longest, measure.getBoundingClientRect().width);
   }
   measure.remove();
   const available = element.clientWidth - 1;
   if (available > 0 && longest > available) element.style.fontSize = `${parseFloat(style.fontSize) * available / longest}px`;
  };
  const observer = new ResizeObserver(fitWords);
  observer.observe(element);
  fitWords();
  return () => observer.disconnect();
 });

 // Keep the external API integration without adding a visible details control.
 $effect(() => {
  const fontId = pairing.font.id;
  if (!supportsDetails || detailsByFont[fontId]) return;
  let cancelled = false;
  tick().then(() => { if (!cancelled) metadataForm?.requestSubmit(); });
  return () => { cancelled = true; };
 });

 onMount(() => {
  const refreshDay = () => {
   const current = stockholmDate();
   if (current !== day) { day = current; offset = 0; }
  };
  refreshDay();
  // Check the local date without making any API request; catch up after a sleeping tab.
  const timer = window.setInterval(refreshDay, 30000);
  document.addEventListener('visibilitychange', refreshDay);
  window.addEventListener('focus', refreshDay);
  return () => {
   window.clearInterval(timer);
   document.removeEventListener('visibilitychange', refreshDay);
   window.removeEventListener('focus', refreshDay);
  };
 });

 $effect(() => {
  const font = pairing.font;
  let cancelled = false;
  loadState = 'loading';
  previewFamily = '';
  loadDiscoveryFont(font).then(family => {
   if (!cancelled) { previewFamily = family; loadState = 'ready'; }
  }).catch(() => { if (!cancelled) loadState = 'unavailable'; });
  return () => { cancelled = true; };
 });
</script>

<section class="font-quote-tool" id="font-quote" aria-labelledby="font-quote-title">
 <h2 class="label" id="font-quote-title">Font &amp; quote of the day</h2>
 <figure class={`specimen ${pairing.font.composition}`} aria-busy={loadState === 'loading'}>
  {#if loadState === 'loading'}
   <p class="loading" role="status">Loading today’s type specimen…</p>
  {:else}
   <blockquote bind:this={quoteElement} class="quote" style:font-family={previewFamily ? `"${previewFamily}"` : 'var(--serif)'} style:font-weight={pairing.font.weight}>{pairing.quote}</blockquote>
   {#if loadState === 'unavailable'}<p class="fallback" role="status">Featured font unavailable. This is a fallback preview.</p>{/if}
  {/if}
 </figure>
 <div class="font-details" aria-live="polite">
  <h3 class="label">{fontResult?.fontDetails?.family || pairing.font.name}</h3>
  {#if supportsDetails}
   <form hidden bind:this={metadataForm} method="POST" action="?/fontDetails#font-quote" use:enhance={() => {
    const fontId = pairing.font.id;
    return async ({ result: response }) => {
     // Keep API results local: inspecting a typeface must not reset the project draft.
     if (response.type === 'success' || response.type === 'failure') detailsByFont[fontId] = response.data;
     else await applyAction(response);
    };
   }}>
    <input type="hidden" name="fontId" value={pairing.font.id} />
   </form>
   {#if fontResult?.fontDetailsMessage}
    <p class="fallback" role="status">{fontResult.fontDetailsMessage}</p>
   {/if}
  {/if}
 </div>
 <!-- Reuse the standard filled button styling from the rest of Studio. -->
 <button class="button" type="button" onclick={() => { offset = nextDiscovery(offset); }}>Discover another</button>
 <noscript><p class="fallback">Enable JavaScript to load the featured font.</p></noscript>
</section>

<style>
 .font-quote-tool{display:flex;flex-direction:column;align-items:center;margin-top:0;padding-top:0;}
 h2{width:100%;margin-bottom:20px;text-align:center;}
 .fallback,.loading{font-family:var(--sans);font-size:var(--studio-caption-size,15px);line-height:1.4;}
 .specimen{width:100%;container-type:inline-size;display:flex;flex-direction:column;justify-content:center;align-items:center;row-gap:24px;min-height:280px;margin-top:0;margin-right:0;margin-bottom:24px;margin-left:0;padding-top:24px;padding-right:24px;padding-bottom:24px;padding-left:24px;background-color:transparent;color:var(--ink);border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);}
 .specimen .quote{width:100%;min-width:0;max-width:100%;box-sizing:border-box;font-size:42px;font-size:clamp(30px,14cqi,54px);line-height:1.2;letter-spacing:-0.02em;text-transform:none;text-align:center;overflow-wrap:anywhere;word-break:normal;hyphens:none;white-space:normal;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;}
 .script .quote{font-size:48px;font-size:clamp(36px,17cqi,64px);line-height:1.35;letter-spacing:0;text-align:center;}
 .retro .quote{text-align:center;letter-spacing:0.015em;}
 .playful .quote{text-align:center;line-height:1.25;letter-spacing:0;}
 .experimental .quote{letter-spacing:0;}
 .font-details{width:100%;text-align:center;}
 .font-details h3{margin-top:0;margin-bottom:8px;}
 .font-quote-tool>.button{align-self:center;}
 .loading,.fallback{margin-top:0;margin-bottom:0;}
</style>
