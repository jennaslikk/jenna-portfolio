<script>
 import Media from '#lib/components/Media.svelte';
 let { sections } = $props();
 const placeholderCount = layout => layout === 'gallery' ? 3 : ['two-images', 'two-videos'].includes(layout) ? 2 : 1;
 const isVideo = layout => ['video', 'two-videos', 'vertical-video'].includes(layout);
</script>

{#each sections as section (section.id)}
 <section class="project-section builder-section" id={section.id}>
  {#if section.heading}<h2 class="label">{section.heading}</h2>{/if}
  <div class:text-with-image={section.layout === 'text-image'}>
   <div>
    {#if section.description}<p class="process-copy">{section.description}</p>{/if}
    {#if section.text}<p class="process-copy additional-text">{section.text}</p>{/if}
   </div>
   {#if section.layout !== 'text'}
    <div class:storyboard={section.layout === 'storyboard'} class:illustrations={section.layout === 'gallery'} class:comparison={['two-images', 'two-videos'].includes(section.layout)} class:single-media={['image', 'video', 'vertical-video'].includes(section.layout)} class:vertical-media={section.layout === 'vertical-video'}>
     {#each Array(placeholderCount(section.layout)) as _, index}
      <figure>
       <Media label={`${section.heading || 'Project'} ${isVideo(section.layout) ? 'video' : 'image'} ${index + 1} — media selection available in Stage C`} ratio={section.layout === 'storyboard' ? '1 / 1' : section.layout === 'vertical-video' || section.layout === 'two-videos' ? '9 / 16' : '16 / 9'} />
      </figure>
     {/each}
    </div>
   {/if}
  </div>
 </section>
{/each}

<style>
 /* These use the same global section, gallery and comparison classes as Fruity Pigs. */
 .builder-section>.label{margin-bottom:24px;}
 .builder-section>.label:has(+div .process-copy){margin-bottom:0;}
 .process-copy{white-space:pre-line;}
 .additional-text{margin-top:24px;}
 .text-with-image{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:36px;row-gap:24px;align-items:start;}
 .single-media{width:min(836px,78%);margin-left:auto;margin-right:auto;}
 .vertical-media{width:min(418px,39%);}
 @media(min-width:1001px){
  .text-with-image{column-gap:81rem;}
  .single-media{width:886rem;max-width:100%;}
  .vertical-media{width:443rem;}
 }
 @media(max-width:700px){
  .text-with-image{grid-template-columns:minmax(0,1fr);}
  .single-media{width:100%;}
  .vertical-media{width:56.25%;}
 }
</style>
