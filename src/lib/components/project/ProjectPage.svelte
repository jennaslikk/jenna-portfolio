<script>
 import { onMount } from 'svelte';
 import Media from '#lib/components/Media.svelte';
 import ProjectSections from '#lib/components/project/ProjectSections.svelte';
 const media = $derived(data.project.media);
 let { data } = $props();
 let detailsOpen = $state(true);
 let projectContent = $state();
 let previewAudio = $state();
 let audioPlaying = $state(false);
 let audioProgress = $state(0);
 let audioDuration = $state(5);

 function formatAudioTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
 }

 async function toggleAudioPreview() {
  if (!previewAudio) return;
  if (previewAudio.paused) {
   try {
    if (previewAudio.ended) previewAudio.currentTime = 0;
    await previewAudio.play();
   } catch (error) {
    console.error('Unable to play sound generation audio preview:', error);
   }
  } else {
   previewAudio.pause();
  }
 }

 function updateAudioProgress() {
  if (!previewAudio) return;
  audioPlaying = !previewAudio.paused;
  if (Number.isFinite(previewAudio.duration)) audioDuration = previewAudio.duration;
  audioProgress = previewAudio.duration ? (previewAudio.currentTime / previewAudio.duration) * 100 : 0;
 }

 onMount(() => {
  const mobile = window.matchMedia('(max-width: 700px)');
  const syncDetails = () => { detailsOpen = !mobile.matches; };
  syncDetails();
  mobile.addEventListener('change', syncDetails);
  let observer;
  const sections = projectContent?.querySelectorAll('#storyboard, #illustrations, #process') ?? [];
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
   observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
     if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      currentObserver.unobserve(entry.target);
     }
    }
   }, { threshold: 0.12 });
   for (const section of sections) {
    section.classList.add('reveal-pending');
    observer.observe(section);
   }
  }
  return () => {
   mobile.removeEventListener('change', syncDetails);
   observer?.disconnect();
  };
 });
</script>
<svelte:head><title>{data.project.title} — Jenna Slikkerveer</title><meta name="description" content={data.project.description}/></svelte:head>
<div class="split project-page"><main id="main" class="project-main"><div class="page-title" class:product-title={data.project.slug === 'fruity-pigs'}><p>{data.project.detailDescription||data.project.description} · {data.project.year||'Year'}</p><h1>{data.project.title}</h1>{#if data.project.slug === 'fruity-pigs' && data.project.productUrl}<a class="button product-button" href={data.project.productUrl} target="_blank" rel="noopener noreferrer">View product</a>{/if}</div><button class="project-details-toggle" aria-expanded={detailsOpen} aria-controls="project-details-content" onclick={() => detailsOpen = !detailsOpen}>Project details {detailsOpen ? '−' : '+'}</button><div class="project-content fade" bind:this={projectContent}>
{#if data.project.layout?.version === 1}
<div class="hero-video work-card-size" class:portrait-size={data.project.format === 'portrait'}><Media label="Project cover — media selection available in Stage C" ratio={data.project.format === 'portrait' ? '9 / 16' : '16 / 9'}/></div>
{#if data.project.body}<section class="project-section"><p class="process-copy project-body">{data.project.body}</p></section>{/if}
<ProjectSections sections={data.project.layout.sections} />
{:else if data.project.createdViaStudio}
<div class="hero-video work-card-size" class:portrait-size={data.project.format === 'portrait'}><Media label="Project artwork" ratio={data.project.format === 'portrait' ? '9 / 16' : '16 / 9'}/></div>
{#if data.project.body}<section class="project-section"><p class="process-copy project-body">{data.project.body}</p></section>{/if}
{:else if data.project.slug==='fruity-pigs'}
<div class="hero-video work-card-size portrait-size" id="film"><Media src={media.film} video label="Fruity Pigs launch film" ratio="9 / 16"/></div>
<section class="project-section" id="storyboard"><h2 class="label">Storyboard</h2><div class="storyboard"><Media src={media.storyboard} label="Original illustrated storyboard" ratio="1"/></div></section>
<section class="project-section" id="illustrations"><h2 class="label">Selected illustrations</h2><div class="illustrations">{#each media.illustrations as src,i}<Media {src} label={`Finished illustration ${i+1}`} ratio="9 / 16"/>{/each}</div></section>
<section class="project-section" id="process"><h2 class="label">Animation process</h2><p class="process-copy">AI-generated movement was combined with layered animation in After Effects. Magnific was used to animate the pig’s expressions and head movements, while clouds and bubbles were added as separate layers, allowing more precise control over their timing and motion.</p><div class="comparison"><figure><Media src={media.aiTest} video autoplay label="AI-generated movement" ratio="9 / 16"/><figcaption>AI-generated movement</figcaption></figure><figure><Media src={media.composite} video autoplay label="Final composite in After Effects preview" ratio="9 / 16"/><figcaption>Final composite in After Effects</figcaption></figure></div></section>
<section class="project-section" id="sound-generation">
 <h2 class="label">Sound generation</h2>
 <p class="process-copy sound-prompt">ElevenLabs prompt: A friendly, middle-aged British gentleman with the warmth of a children's book narrator. Gentle, clear, and comforting, with a polite, slightly amused cadence. Deliberate, unhurried pacing and a soft, smiling tone, free from harshness.</p>
 <div class="audio-player">
  <audio id="sound-generation-audio" bind:this={previewAudio} preload="metadata" aria-hidden="true" tabindex="-1" ontimeupdate={updateAudioProgress} onplay={updateAudioProgress} onpause={updateAudioProgress} onended={updateAudioProgress}>
   <source src={media.sound} type="audio/mpeg"/>
  </audio>
  <div class="audio-player-row">
   <button class="audio-toggle" type="button" aria-label={audioPlaying ? 'Pause audio preview' : 'Play audio preview'} aria-controls="sound-generation-audio" onclick={toggleAudioPreview}>
    <span class="audio-icon" class:playing={audioPlaying} aria-hidden="true"></span>
   </button>
   <span class="audio-title">British Children’s Book Narrator</span>
   <span class="audio-duration">{formatAudioTime(audioDuration)}</span>
  </div>
  <div class="audio-progress" role="progressbar" aria-label="Audio playback progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(audioProgress)}>
   <span style={`width:${audioProgress}%`}></span>
  </div>
 </div>
</section>
{:else if data.project.film}
<div class="hero-video landscape-video work-card-size" id="film"><Media src={data.project.film} video label={`${data.project.title} promotional video`} ratio="16 / 9"/></div>
{:else if data.project.cover}
<div class="hero-video work-card-size" class:portrait-size={data.project.format === 'portrait'}><Media src={data.project.cover} hoverSrc={data.project.hoverCover || ''} active label={data.project.title} ratio={data.project.format === 'portrait' ? '9 / 16' : '16 / 9'}/></div>
{:else}<div class="hero-video work-card-size" class:portrait-size={data.project.format === 'portrait'}><Media label="Project artwork" ratio={data.project.format === 'portrait' ? '9 / 16' : '16 / 9'}/></div><section class="project-section"><p>Project details coming soon.</p><a href="/work">← All work</a></section>{/if}</div></main>
<aside class="project-sidebar"><div class="sticky-details"><div id="project-details-content" class:collapsed={!detailsOpen} aria-hidden={!detailsOpen} inert={!detailsOpen}><div class="project-details-inner"><section><h2 class="label">Client</h2><p>{data.project.client||'To be added'}</p></section>{#if data.project.slug==='fruity-pigs' || data.project.createdViaStudio}<section><h2 class="label">Context</h2><p>{data.project.context}</p></section><section><h2 class="label">My role</h2><p>{#each data.project.roles as role, i}{#if i > 0}<br/>{/if}{role}{/each}</p></section><section><h2 class="label">Tools</h2><p>{#each data.project.tools as tool, i}{#if i > 0}<br/>{/if}{tool}{/each}</p></section>{/if}{#if data.project.summary}<section><h2 class="label">Summary (AI-generated)</h2><p>{data.project.summary}</p></section>{/if}<a class="button" href="/work">View all work</a></div></div></div></aside></div>

<style>
 /* Match the gap before Sound generation at the end of this case study too. */
 .project-page:has(#sound-generation) .project-content{padding-bottom:100px;}
 @media(min-width:1001px){
  .project-page:has(#sound-generation) .project-content{padding-bottom:100rem;}
 }
 @media(max-width:700px){
  .project-page:has(#sound-generation) .project-content{padding-bottom:64px;}
 }

 /* Align the audio player's outer edges with the combined comparison previews. */
 .audio-player {
  width: min(836px, 78%);
  margin-left: auto;
  margin-right: auto;
 }
 @media (min-width: 1001px) {
  .audio-player { width: 886rem; }
 }
 @media (max-width: 700px) {
  .audio-player { width: 100%; }
  .project-section>.label { margin-bottom:24px; }
 }
 /* Supporting paragraphs follow their headings directly at every screen size.
    Headings before images retain their existing gallery spacing. */
 .project-section>.label:has(+p){margin-bottom:0;}
 .project-section>.label+p{margin-top:0;}
 .project-body { white-space: pre-line; margin-top: 24px; }
 .hero-video.work-card-size { width: calc((85% - 162rem) * 872 / 1274 + 81rem); margin-left: auto; margin-right: auto; }
 .hero-video.work-card-size.portrait-size { width: calc((85% - 162rem) * 402 / 1274); }
 @media(min-width:701px) and (max-width:1000px) {
  .hero-video.work-card-size { width: calc((85% - 50px) * 872 / 1274 + 25px); max-width: 100%; }
  .hero-video.work-card-size.portrait-size { width: calc((85% - 50px) * 402 / 1274); }
 }
 @media(max-width:700px) {
  .hero-video.work-card-size { width:86%; }
  /* Match Work: portrait width equals a full-width landscape preview's height. */
  .hero-video.work-card-size.portrait-size { width:calc(86% * 9 / 16); }
 }
 .project-main .page-title.product-title { padding-top: 54px; padding-bottom: 54px; }
 @media(max-width:700px) {
  .project-main .page-title.product-title { padding-top: 40px; padding-bottom: 40px; }
 }
 .page-title .product-button {
  display: inline-flex;
  max-width: 100%;
  margin-top: 24px;
  margin-right: auto;
  margin-bottom: 0;
  margin-left: auto;
 }
 @media(min-width:1001px) {
  .project-main .page-title.product-title { padding-top: 70rem; padding-bottom: 70rem; }
  .page-title .product-button {
   margin-top: 28rem;
   width: 165rem;
  }
 }
</style>
