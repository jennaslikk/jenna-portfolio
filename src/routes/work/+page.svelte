<script>
 let { data } = $props();
 const projects = $derived(data.projects);
 import Media from '#lib/components/Media.svelte';
 import { projectGrid } from '#lib/project-grid';
 const placements = $derived(projectGrid(projects));
 import { fade } from 'svelte/transition';
 import { onMount, getContext } from 'svelte';
 const workHasMultipleRows = getContext('workHasMultipleRows');

 function measureRows(node) {
  // Measure the actual layout so filters and mobile wrapping are both respected.
  const update = () => {
   const cards = [...node.querySelectorAll('.project-card')];
   const firstTop = cards[0]?.getBoundingClientRect().top;
   workHasMultipleRows.set(cards.some(card => Math.abs(card.getBoundingClientRect().top - firstTop) > 2));
  };
  const observer = new ResizeObserver(update);
  observer.observe(node);
  const frame = requestAnimationFrame(update);
  return { destroy() { cancelAnimationFrame(frame); observer.disconnect(); } };
 }

 const categories = ['All Projects', 'AI Creative', 'Motion Graphics', 'Branding', 'Illustration'];
 // Database categories preserve the existing multi-category filters.
 let mobileFiltersOpen = $state(false);
 let selectedCategory = $state('All Projects');
 let displayedCategory = $state('All Projects');
 let visible = $state(true);
 let reducedMotion = $state(false);
 const filteredProjects = $derived(projects.filter(project => displayedCategory === 'All Projects' || project.category.includes(displayedCategory)));

 onMount(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => reducedMotion = preference.matches;
  update();
  preference.addEventListener('change', update);
  return () => preference.removeEventListener('change', update);
 });

 function selectCategory(category) {
  mobileFiltersOpen = false;
  if (category === selectedCategory) return;
  selectedCategory = category;
  visible = false;
 }

 function finishFilter() {
  displayedCategory = selectedCategory;
  visible = true;
 }
</script>
<svelte:head><title>Selected Work — Jenna Slikkerveer</title><meta name="description" content="Selected design, illustration and animation projects by Jenna Slikkerveer."/><link rel="preload" as="image" href="/projects/barbie-berry-kisses/hover-preview.gif" type="image/gif"/></svelte:head>
<div class="split work-layout">
 <main id="main" class="work-main fade">
  <div class="grid-container">
   {#if visible}
    <div class="project-grid" use:measureRows class:single-result={filteredProjects.length === 1} class:ai-creative-grid={displayedCategory === 'AI Creative' && filteredProjects.every(project => project.format === 'portrait')} class:motion-grid={displayedCategory === 'Motion Graphics'} in:fade={{ duration: reducedMotion ? 0 : 125 }} out:fade={{ duration: reducedMotion ? 0 : 125 }} onoutroend={finishFilter}>
     {#each filteredProjects as project (project.slug)}
      <article class={`project-card card-${projects.indexOf(project) + 1}`} class:portrait-card={project.format === 'portrait'} class:pattern-staggered={displayedCategory === 'All Projects' && placements[project.slug].staggered} style:grid-row-start={displayedCategory === 'All Projects' ? placements[project.slug].row : undefined} style:grid-column-start={displayedCategory === 'All Projects' ? placements[project.slug].column : undefined}>
       <a href={`/work/${project.slug}`}>
        {#if project.workCardVideo && project.film}
         <Media src={project.film} video autoplay label={`${project.title}: ${project.description}`} ratio={project.format === 'portrait' ? '9 / 16' : '16 / 9'}/>
        {:else}
         <Media src={project.cover || ''} hoverSrc={project.hoverCover || ''} hoverVideoSrc={project.hoverVideo || ''} active autoplay label={project.title} ratio={project.format === 'portrait' ? '9 / 16' : '16 / 9'}/>
        {/if}
        <h2 class="label">{project.title}</h2>
        <p>{project.description}</p>
       </a>
      </article>
     {/each}
     {#if filteredProjects.length === 0}<p class="empty-state">No projects in this category yet.</p>{/if}
    </div>
   {/if}
  </div>
 </main>
 <aside class="home-sidebar work-sidebar" aria-label="Filter work">
  <section class="work-filters">
   <button class="mobile-filter-toggle" type="button" aria-expanded={mobileFiltersOpen} aria-controls="work-filter-options" onclick={() => mobileFiltersOpen = !mobileFiltersOpen}>{selectedCategory} {mobileFiltersOpen ? '−' : '+'}</button>
   <div id="work-filter-options" class="filter-list" class:mobile-open={mobileFiltersOpen} role="group" aria-label="Filter work">
    {#each categories as category}
     <button type="button" class:active={selectedCategory === category} aria-pressed={selectedCategory === category} onclick={() => selectCategory(category)}>{category}</button>
    {/each}
   </div>
  </section>
 </aside>
</div>

<style>
 .mobile-filter-toggle { display: none; }
 .work-main { min-width: 0; }
 .mobile-filter-toggle:focus-visible,
 .filter-list button:focus-visible { outline: var(--hairline) solid var(--line); outline-offset: 5px; }
 .grid-container { min-height: 60vh; }
 .project-grid { --column-gap: 42px; --row-gap: 48px; row-gap: var(--row-gap); width: 85%; column-gap: var(--column-gap); grid-template-columns: minmax(0,402fr) minmax(0,470fr) minmax(0,402fr); }
 .project-card { min-width: 0; align-self: start; }
 .pattern-staggered { margin-top: 110px; }
 /* Size every card by format, including projects added after the original five. */
 .project-card:not(.portrait-card) { grid-column-end: span 2; }
 .portrait-card { grid-column-start: 3; grid-column-end: 4; }
 .motion-grid .card-2 { grid-row: 1; }
 .motion-grid .card-4 { grid-row: 1; }
 /* A filtered card keeps its original grid width, independent of result order. */
 .single-result .project-card { grid-column: 1 / -1; justify-self: center; width: calc((100% - 2 * var(--column-gap)) * 872 / 1274 + var(--column-gap)); margin-top: 0; }
 .single-result .portrait-card { width: calc((100% - 2 * var(--column-gap)) * 402 / 1274); }
 .ai-creative-grid { grid-template-columns: repeat(2, minmax(0, calc((100% - 2 * var(--column-gap)) * 402 / 1274))); justify-content: center; align-items: start; }
 .ai-creative-grid .project-card { grid-column: auto; margin-top: 0; }
 .work-sidebar { display: block; }
 .work-sidebar .work-filters { position: sticky; top: var(--header); max-height: calc(100dvh - var(--header)); overflow-y: auto; }
 .filter-list { display: flex; flex-direction: column; align-items: flex-start; margin-top: 0; gap: 12px; }
 .filter-list button { display: block; min-height: 0; padding: 0; border: 0; background: transparent; color: var(--ink); font-family: 'futura-pt', Futura, sans-serif; font-size: 16px; line-height: 1.3; font-weight: 400; text-transform: none; white-space: nowrap; text-align: left; }
 .filter-list button.active { font-family: 'futura-pt-bold', var(--sans); font-weight: 700; }
 .empty-state { grid-column: 1 / -1; }
 @media(min-width:1001px) {
  .project-grid { --column-gap: 81rem; --row-gap: 70rem; }
  .pattern-staggered { margin-top: 175rem; }
  .filter-list { gap: 16rem; }
  .filter-list button { font-size: 24rem; line-height: 28.8rem; }
 }
 @media(max-width:1000px) {
  .project-grid { --column-gap: 25px; --row-gap: 36px; }
  .work-layout { display: flex; flex-direction: column; }
  .work-sidebar { order: -1; border-top: 0; border-left: 0; border-bottom: 0; }
  .work-sidebar .work-filters { position: static; max-height: none; padding: 28px 7%; }
  .mobile-filter-toggle { display: flex; justify-content: flex-start; width: 100%; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--ink); font-size: 16px; text-transform: none; text-align: left; }
  .filter-list { display: none; flex-direction: column; gap: 12px; margin-top: 20px; }
  .filter-list.mobile-open { display: flex; }
 }
 @media(max-width:700px) {
  .work-sidebar .work-filters { padding: 28px 7% 0; }
  .work-main { padding-top: 20px; }
  .project-grid { display: block; width: 86%; }
  .project-grid .project-card { width: 100%; }
  /* 9/16 of the content width equals a full-width landscape preview's height. */
  .project-grid .project-card.portrait-card {
   width:56.25%;
   margin-left:0;
   margin-right:auto;
   text-align:left;
  }
  .pattern-staggered { margin-top: 0; }
  .project-card :global(.media) { max-height: none; }
  .project-card :global(.media img),
  .project-card :global(.media video) { object-fit:contain; }
 }
</style>
