<script>
 import { onMount, tick } from 'svelte';
 import { makeSection, moveSection, sectionTypes, sectionLayouts, projectFromForm } from '#lib/studio/project-sections';
 let { sections = $bindable([]) } = $props();
 let newType = $state('introduction');
 let message = $state('');
 let preview = $state(null);
 let mode = $state('desktop');
 let dialog = $state();
 let frame = $state();

 function addSection() {
  if (sections.length >= 24) return;
  sections = [...sections, makeSection(newType, 'section-' + crypto.randomUUID())];
 }
 function sendPreview() {
  if (preview && frame?.contentWindow) frame.contentWindow.postMessage({ type: 'studio-project-preview', project: $state.snapshot(preview) }, window.location.origin);
 }
 async function openPreview(event) {
  message = '';
  try {
   preview = projectFromForm(new FormData(event.currentTarget.form), $state.snapshot(sections));
   await tick();
   dialog.showModal();
   sendPreview();
  } catch (error) { message = error.message; }
 }
 function closePreview() { dialog.close(); preview = null; }
 onMount(() => {
  const ready = event => {
   if (event.origin === window.location.origin && event.source === frame?.contentWindow && event.data?.type === 'studio-preview-ready') sendPreview();
  };
  window.addEventListener('message', ready);
  return () => window.removeEventListener('message', ready);
 });
</script>

<section class="section-editor" aria-labelledby="builder-title">
 <h3 class="label" id="builder-title">Build your project layout</h3>
 <p class="hint">Stage A: arrange sections and preview your case study. This layout is not saved yet: refreshing or leaving Studio clears it. Draft saving and layout publishing will arrive in Stage D.</p>
 <input type="hidden" name="builderLayout" value={JSON.stringify({ version: 1, sections })} />
 <div class="add-section">
  <label class="label" for="builder-section-type">Add a section</label>
  <select id="builder-section-type" bind:value={newType}>
   {#each sectionTypes as type}<option value={type.type}>{type.label}</option>{/each}
  </select>
  <button class="button outline" type="button" onclick={addSection} disabled={sections.length >= 24}>Add section</button>
 </div>
 {#if !sections.length}<p class="hint">Start with an introduction, then add the parts of your process you want to show.</p>{/if}
 <div class="section-list">
  {#each sections as section, index (section.id)}
   <article class="editor-section" aria-label={`Section ${index + 1}: ${section.heading}`}>
    <h4 class="label">{index + 1}. {sectionTypes.find(type => type.type === section.type)?.label}</h4>
    <label class="label" for={`${section.id}-heading`}>Heading</label>
    <input id={`${section.id}-heading`} type="text" maxlength="160" bind:value={section.heading} />
    <label class="label" for={`${section.id}-description`}>Description</label>
    <textarea id={`${section.id}-description`} rows="3" maxlength="2000" bind:value={section.description}></textarea>
    <label class="label" for={`${section.id}-text`}>Additional text</label>
    <textarea id={`${section.id}-text`} rows="3" maxlength="5000" bind:value={section.text}></textarea>
    <label class="label" for={`${section.id}-layout`}>Presentation</label>
    <select id={`${section.id}-layout`} bind:value={section.layout}>
     {#each sectionLayouts as layout}<option value={layout.value}>{layout.label}</option>{/each}
    </select>
    <p class="hint">The preview shows media placeholders. Selecting your existing images and videos will be added in Stage C.</p>
    <div class="section-actions">
     <button class="button outline" type="button" aria-label={`Move section ${index + 1} up`} disabled={index === 0} onclick={() => { sections = moveSection(sections, index, -1); }}>Move up</button>
     <button class="button outline" type="button" aria-label={`Move section ${index + 1} down`} disabled={index === sections.length - 1} onclick={() => { sections = moveSection(sections, index, 1); }}>Move down</button>
     <button class="button outline" type="button" aria-label={`Remove section ${index + 1}`} onclick={() => { sections = sections.filter(item => item.id !== section.id); }}>Remove</button>
    </div>
   </article>
  {/each}
 </div>
 {#if message}<p class="hint" role="alert">{message}</p>{/if}
 <button class="button" type="button" onclick={openPreview}>Preview project</button>
 <noscript><p class="hint">Enable JavaScript to edit sections and open the private preview.</p></noscript>
</section>

<dialog class="preview-dialog" bind:this={dialog} onclose={() => { preview = null; }} aria-labelledby="preview-title">
 <div class="preview-toolbar">
  <div><h2 class="label" id="preview-title">Private project preview</h2><p class="hint">Not saved or published. No AI request is made.</p></div>
  <div class="preview-actions">
   <button class="button outline" type="button" aria-pressed={mode === 'desktop'} onclick={() => { mode = 'desktop'; }}>Desktop · 1440px</button>
   <button class="button outline" type="button" aria-pressed={mode === 'mobile'} onclick={() => { mode = 'mobile'; }}>Mobile · 390px</button>
   <button class="button" type="button" onclick={closePreview}>Edit project</button>
   <button class="return-studio" type="button" onclick={closePreview}>Return to Studio</button>
  </div>
 </div>
 <div class="preview-viewport">
  {#if preview}
   <!-- A real iframe viewport runs the same responsive CSS as a published project. -->
   <iframe bind:this={frame} src="/studio/preview" title={`${mode === 'mobile' ? 'Mobile' : 'Desktop'} portfolio project preview`} style:width={mode === 'mobile' ? '390px' : '1440px'} onload={sendPreview}></iframe>
  {/if}
 </div>
</dialog>

<style>
 .section-editor{width:100%;display:flex;flex-direction:column;align-items:flex-start;row-gap:20px;padding-top:24px;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
 h3,h4{margin-top:0;margin-bottom:0;}
 .hint{font-size:var(--studio-caption-size,15px);line-height:1.4;margin-top:0;margin-bottom:0;}
 .add-section,.section-list{width:100%;display:flex;flex-direction:column;align-items:flex-start;row-gap:12px;}
 .editor-section{width:100%;display:flex;flex-direction:column;row-gap:12px;padding-top:24px;padding-bottom:24px;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
 input,textarea,select{box-sizing:border-box;width:100%;min-width:0;min-height:44px;padding-top:12px;padding-right:14px;padding-bottom:12px;padding-left:14px;border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0;background-color:#fff;color:var(--ink);font-family:var(--sans);font-size:inherit;line-height:1.3;}
 input[type='hidden']{display:none;}
 textarea{resize:vertical;}
 .section-actions,.preview-actions{display:flex;flex-wrap:wrap;column-gap:12px;row-gap:12px;align-items:center;}
 .preview-dialog{width:calc(100vw - 32px);max-width:1600px;height:calc(100dvh - 32px);max-height:none;top:0;right:0;bottom:0;left:0;margin-top:auto;margin-right:auto;margin-bottom:auto;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);background-color:#fff;color:var(--ink);}
 .preview-dialog[open]{display:flex;flex-direction:column;}
 .preview-dialog::backdrop{background-color:rgb(28 28 28 / 35%);}
 .preview-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;column-gap:24px;row-gap:16px;padding-top:16px;padding-right:20px;padding-bottom:16px;padding-left:20px;border-bottom-width:var(--hairline);border-bottom-style:solid;border-bottom-color:var(--line);}
 .preview-toolbar h2{margin-top:0;margin-bottom:6px;}
 .preview-actions button{font-size:13px;}
 .preview-actions [aria-pressed='true']{background-color:var(--lilac);}
 .return-studio{background-color:transparent;color:var(--ink);border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;padding-top:8px;padding-right:0;padding-bottom:8px;padding-left:0;text-decoration-line:underline;text-transform:none;}
 .preview-viewport{min-height:0;max-width:100%;overflow-x:auto;overflow-y:hidden;flex-grow:1;display:flex;justify-content:safe center;background-color:#f8f8f8;}
 iframe{flex-shrink:0;max-width:none;height:100%;border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;background-color:#fff;}
 @media(max-width:700px){.preview-dialog{width:100vw;height:100dvh;border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;}.preview-toolbar{padding-right:12px;padding-left:12px;}.preview-actions{column-gap:8px;row-gap:8px;}}
</style>
