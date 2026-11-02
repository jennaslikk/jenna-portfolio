<script>
 import { afterUpdate } from 'svelte';
 export let src = ''; export let label = 'Project image'; export let ratio = '16 / 9'; export let video = false;
 export let hoverSrc = ''; export let active = false;
 export let hoverVideoSrc = '';
 export let hoverPlay = false;
 export let autoplay = false;

 let videoElement;

 function syncHoverVideo() {
  if (!hoverVideoSrc || !videoElement) return;
  if (active || autoplay) {
   if (videoElement.paused) videoElement.play().catch((error) => console.error(`Unable to play ${label} preview:`, error));
  } else {
   videoElement.pause();
   if (videoElement.readyState >= 1) videoElement.currentTime = 0;
  }
 }

 afterUpdate(syncHoverVideo);

 function playOnHover() {
  if (hoverPlay && videoElement) {
   videoElement.play().catch((error) => console.error(`Unable to play ${label} preview:`, error));
  }
 }

 function stopOnLeave() {
  if (hoverPlay && videoElement) {
   videoElement.pause();
   videoElement.currentTime = 0;
  }
 }
</script>
<div class="media" class:has-hover-video={hoverVideoSrc} style:aspect-ratio={ratio}>
 {#if src}{#if video}<video bind:this={videoElement} autoplay={autoplay} controls={!hoverPlay && !autoplay} muted={hoverPlay || autoplay} loop={hoverPlay || autoplay} playsinline preload="metadata" aria-label={label} onmouseenter={playOnHover} onmouseleave={stopOnLeave}><source {src}/><track kind="captions"/></video>{:else if hoverVideoSrc}<img src={src} alt={label} loading="lazy"/><video class="media-hover-preview" class:active={active || autoplay} bind:this={videoElement} autoplay={autoplay || active} muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"><source src={hoverVideoSrc} type="video/mp4"/></video>{:else}<img src={active && hoverSrc ? hoverSrc : src} alt={label} loading="lazy"/>{/if}
 {:else}<div class="media-empty" role="img" aria-label={`${label} — placeholder`}></div>{/if}
</div>
