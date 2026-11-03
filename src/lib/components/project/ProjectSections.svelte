<script>
 import Media from '#lib/components/Media.svelte';
 import InlineText from './InlineText.svelte';
 let { sections, editable = false, onedit = () => {} } = $props();
 const placeholderCount = layout => layout === 'gallery' ? 3 : ['two-images', 'two-videos'].includes(layout) ? 2 : 1;
 const isVideo = layout => ['video', 'two-videos', 'vertical-video'].includes(layout);
</script>

{#each sections as section, sectionIndex (section.id)}
 <section class="project-section builder-section" class:visual-section={editable} id={section.id}>
  {#if editable}
   <div class="visual-section-tools" aria-label="Section controls">
    <button type="button" onclick={() => onedit({kind:'section',id:section.id})}>Layout options</button>
    <button type="button" aria-label="Move section up" disabled={sectionIndex===0} onclick={() => onedit({kind:'move',id:section.id,direction:-1})}>↑</button>
    <button type="button" aria-label="Move section down" disabled={sectionIndex===sections.length-1} onclick={() => onedit({kind:'move',id:section.id,direction:1})}>↓</button>
    <button type="button" onclick={() => onedit({kind:'remove',id:section.id})}>Remove</button>
   </div>
  {/if}
  {#if section.heading || editable}<h2 class="label">{#if editable}<InlineText value={section.heading} label="Section heading" placeholder="Add a heading" limit={160} multiline={false} onchange={value => onedit({kind:'inline',target:'section',id:section.id,field:'heading',value})} />{:else}{section.heading}{/if}</h2>{/if}
    {#if section.description || editable}<p class="process-copy">{#if editable}<InlineText value={section.description} label="Section description" placeholder="Add a description" limit={2000} onchange={value => onedit({kind:'inline',target:'section',id:section.id,field:'description',value})} />{:else}{section.description}{/if}</p>{/if}
    {#if section.text}<p class="process-copy additional-text">{#if editable}<InlineText value={section.text} label="Additional section text" limit={5000} onchange={value => onedit({kind:'inline',target:'section',id:section.id,field:'text',value})} />{:else}{section.text}{/if}</p>{/if}
   {#if section.layout !== 'text'}
    <div class:storyboard={section.layout === 'storyboard'} class:illustrations={section.layout === 'gallery'} class:comparison={['two-images', 'two-videos'].includes(section.layout)} class:single-media={['text-image', 'image', 'video', 'vertical-video'].includes(section.layout)} class:vertical-media={section.layout === 'vertical-video'}>
     {#each Array(Math.max(section.media.length,placeholderCount(section.layout))) as _, index}
      {@const item = section.media[index]}
      {@const ratio = item?.ratio || (section.layout === 'storyboard' ? 1 : section.layout === 'vertical-video' || section.layout === 'two-videos' ? 9 / 16 : 16 / 9)}
      <figure class:visual-media={editable}>
       {#if item}
        <Media src={item.src} video={item.kind==='video'} label={item.alt || section.heading} ratio={String(ratio)} />
        {#if item.caption || editable}<figcaption>{#if editable}<InlineText value={item.caption} label="Media caption" placeholder="Add a caption" limit={500} onchange={value => onedit({kind:'inline',target:'caption',id:section.id,index,value})} />{:else}{item.caption}{/if}</figcaption>{/if}
        {#if editable}<button class="visual-media-button" type="button" onclick={() => onedit({kind:'media',id:section.id,index})}>Replace {item.kind}</button>{/if}
       {:else if editable}
        <button class="visual-placeholder" type="button" style:aspect-ratio={String(ratio)} onclick={() => onedit({kind:'media',id:section.id,index})}><span>Add {isVideo(section.layout)?'video':'image'}</span><small>Choose from your project library</small></button>
       {:else}<Media label={`${section.heading || 'Project'} ${isVideo(section.layout)?'video':'image'} placeholder`} ratio={String(ratio)} />{/if}
      </figure>
     {/each}
    </div>
   {/if}
 </section>
{/each}

<style>
 /* Placeholders must shrink inside the same responsive grids as real media. */
 .builder-section figure{min-width:0;}
 /* Match Fruity Pigs: heading, supporting text, then the media block. */
 /* Keep generated layouts tighter without changing established project pages. */
 .builder-section{margin-top:56px;}
 .builder-section>.label:has(+p){margin-bottom:0;}
 .builder-section>.label+p{margin-top:0;}
 .process-copy{white-space:pre-line;line-height:1.3;margin-bottom:0;}
 .additional-text{margin-top:0;}
 .single-media{width:min(836px,78%);margin-left:auto;margin-right:auto;}
 .vertical-media{width:min(418px,39%);}
 @media(min-width:1001px){.single-media{width:886rem;max-width:100%;}.vertical-media{width:443rem;}}
 @media(max-width:700px){.builder-section{margin-top:40px;}.builder-section>.label{margin-bottom:24px;}.builder-section>.label:has(+p){margin-bottom:0;}.single-media{width:100%;}.vertical-media{width:56.25%;}}
</style>
