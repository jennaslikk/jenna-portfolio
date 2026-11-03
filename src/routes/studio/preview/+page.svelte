<script>
 import { onMount } from 'svelte';
 import ProjectPage from '#lib/components/project/ProjectPage.svelte';
 import { validatePreviewProject } from '#lib/studio/project-sections';
 let { data } = $props();
 let editable = $state(false);
 let project = $state(null);
 let message = $state('Preparing your private preview…');
 onMount(() => {
  const receive = event => {
   // Accept data only from this preview's same-origin parent, never from another tab/site.
   if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== 'studio-project-preview') return;
   try { project = validatePreviewProject(event.data.project, data.builderMedia); editable = event.data.editable === true; } catch { project = null; message = 'The preview could not read this layout. Return to Studio and check the sections.'; }
  };
  const preventNavigation = event => {
   const anchor = event.target.closest?.('a');
   if (anchor && !anchor.getAttribute('href')?.startsWith('#')) event.preventDefault();
  };
  window.addEventListener('message', receive);
  document.addEventListener('click', preventNavigation);
  window.parent.postMessage({ type: 'studio-preview-ready' }, window.location.origin);
  return () => { window.removeEventListener('message', receive); document.removeEventListener('click', preventNavigation); };
 });
</script>

<svelte:head><meta name="robots" content="noindex, nofollow" /></svelte:head>
{#if project}<ProjectPage data={{ project }} {editable} onedit={action => window.parent.postMessage({type:'studio-project-edit',action},window.location.origin)} />{:else}<main id="main" class="preview-wait"><p>{message}</p></main>{/if}

<style>
 .preview-wait{padding-top:48px;padding-right:7%;padding-bottom:48px;padding-left:7%;font-family:var(--sans);font-size:18px;}
</style>
