<script>
 import { onMount, tick } from 'svelte';
 import { enhance, applyAction } from '$app/forms';
 import { invalidateAll } from '$app/navigation';
 import { projectCategories } from '#lib/project-form';
 import { makeSection, moveSection, sectionLayouts, validatePreviewProject, updatePreviewText } from '#lib/studio/project-sections';
 let { media = [], savedProjects = [], listMessage = '' } = $props();
 let ready = $state(false), generating = $state(false), message = $state('');
 let draft = $state(null), questions = $state([]), suggestions = $state({});
 let reference = $state(''), referenceMessage = $state('');
 let workspace = $state(), panel = $state(), frame = $state();
 let editing = $state(true), mode = $state('desktop');
 let selection = $state(null), sectionEdit = $state(null), projectEdit = $state(null);
 let selectedMedia = $state(null), choosingMedia = $state(false), panelMessage = $state('');
 let removed = $state(null);
 let inlineMessage = $state('');
 let sourceBrief = $state(null), draftKey = $state(''), savedSlug = $state(''), revision = $state('');
 let saving = $state(false), published = $state(false), saveMessage = $state(''), savedSignature = $state('');
 let publishDialog = $state(), approval = $state(false);
 const dirty = $derived(!!draft && !published && JSON.stringify(draft) !== savedSignature);
 const savedDrafts = $derived(savedProjects.filter(project => project.status === 'draft'));
 const publishedProjects = $derived(savedProjects.filter(project => project.status === 'published'));

 function prepareSave({formData,cancel}) {
  if(saving || !draft || published){cancel();return;}
  const intent = formData.get('intent');
  const project = $state.snapshot(draft), signature = JSON.stringify(project);
  formData.set('layout',JSON.stringify({project,brief:$state.snapshot(sourceBrief),key:draftKey,slug:savedSlug,revision,intent,confirmed:intent === 'publish' && approval}));
  saving = true;saveMessage = '';
  return async({result}) => {
   try {
    if(result.type === 'success' && result.data?.saved){
     savedSlug=result.data.saved.slug;revision=result.data.saved.revision;
     published=result.data.saved.status === 'published';savedSignature=signature;
     saveMessage=result.data.saveMessage;
     if(published){editing=false;publishDialog.close();}
     await invalidateAll();
    }else if(result.type === 'failure')saveMessage=result.data?.saveMessage || 'The project could not be saved. Your changes remain here.';
    else await applyAction(result);
   }catch{saveMessage='The save could not be confirmed. Refresh Your projects before saving again; your changes remain in this tab.';}
   finally{saving=false;}
  };
 }

 function prepareOpen({cancel}) {
  if(saving || (dirty && !window.confirm('Your current changes are not saved. Open another draft anyway?'))){cancel();return;}
  saveMessage='';
  return async({result}) => {
   if(result.type === 'success' && result.data?.openedDraft){
    const saved=result.data.openedDraft;
    draft=validatePreviewProject(saved.project,media);sourceBrief=saved.brief;draftKey=saved.key;
    savedSlug=saved.slug;revision=saved.revision;savedSignature=JSON.stringify(draft);
    questions=[];suggestions={};removed=null;published=false;editing=true;
    await showWorkspace();
   }else if(result.type === 'failure')saveMessage=result.data?.saveMessage || 'This draft could not be opened.';
   else await applyAction(result);
  };
 }
 const desiredKind = $derived(selection?.kind === 'cover' ? 'image' : ['video','two-videos','vertical-video'].includes(draft?.layout.sections.find(s=>s.id===selection?.id)?.layout) ? 'video' : 'image');
 const availableMedia = $derived(media.filter(item=>item.kind===desiredKind));

 function sendDraft() {
  if(draft && frame?.contentWindow)frame.contentWindow.postMessage({type:'studio-project-preview',project:$state.snapshot(draft),editable:editing},window.location.origin);
 }
 $effect(()=>{if(draft){JSON.stringify(draft);sendDraft();}});
 async function showWorkspace(){await tick();if(!workspace.open)workspace.showModal();sendDraft();}
 function closeWorkspace(){workspace.close();}
 function openPanel(action){
  panelMessage='';selection=action;selectedMedia=null;
  const section=draft?.layout.sections.find(item=>item.id===action.id);
  if(action.kind==='section'&&section)sectionEdit=structuredClone($state.snapshot(section));
  if(action.kind==='project')projectEdit={...$state.snapshot(draft),rolesText:draft.roles.join('\n'),toolsText:draft.tools.join('\n')};
  if(action.kind==='media'&&section?.media[action.index])selectedMedia=structuredClone($state.snapshot(section.media[action.index]));
  panel.showModal();
 }
 function editAction(action){
  if(!editing||!draft||!action||typeof action.kind!=='string')return;
  if(action.kind==='inline'){
   try { draft=updatePreviewText($state.snapshot(draft),action,media);inlineMessage=''; }
   catch(error){inlineMessage=error.message;}
   return;
  }
  const index=draft.layout.sections.findIndex(section=>section.id===action.id);
  if(action.kind==='move'&&index>=0&&[-1,1].includes(action.direction))draft.layout.sections=moveSection(draft.layout.sections,index,action.direction);
  else if(action.kind==='remove'&&index>=0){removed={section:draft.layout.sections[index],index};draft.layout.sections=draft.layout.sections.filter(section=>section.id!==action.id);}
  else if(['project','cover'].includes(action.kind)||index>=0&&['section','media'].includes(action.kind))openPanel(action);
 }
 onMount(()=>{
  ready=true;
  const receive=event=>{
   if(event.origin!==window.location.origin||event.source!==frame?.contentWindow)return;
   if(event.data?.type==='studio-preview-ready')sendDraft();
   if(event.data?.type==='studio-project-edit')editAction(event.data.action);
  };
  window.addEventListener('message',receive);
  const leave = event => {if(dirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',leave);
  return()=>{window.removeEventListener('message',receive);window.removeEventListener('beforeunload',leave);if(reference)URL.revokeObjectURL(reference);};
 });
 function chooseReference(event){
  const file=event.currentTarget.files?.[0];referenceMessage='';
  if(reference)URL.revokeObjectURL(reference);reference='';
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){referenceMessage='Choose a JPG, PNG or WebP image under 5 MB.';return;}
  reference=URL.createObjectURL(file);
 }
 function addSection(type){
  if(draft.layout.sections.length>=24)return;
  draft.layout.sections=[...draft.layout.sections,makeSection(type,'section-'+crypto.randomUUID())];panel.close();
 }
 function applyEdits(){
  try{
   if(selection.kind==='section'){
    const next={...$state.snapshot(draft),layout:{version:1,sections:draft.layout.sections.map(item=>item.id===selection.id?$state.snapshot(sectionEdit):$state.snapshot(item))}};
    draft=validatePreviewProject(next,media);
   }else if(selection.kind==='project'){
    const lines=text=>text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    draft=validatePreviewProject({...$state.snapshot(draft),...$state.snapshot(projectEdit),roles:lines(projectEdit.rolesText),tools:lines(projectEdit.toolsText)},media);
   }else if(selectedMedia){
    if(selection.kind==='cover'){draft.cover=selectedMedia.src;draft.coverRatio=selectedMedia.ratio;}
    else{
     const section=draft.layout.sections.find(item=>item.id===selection.id);
     const index=Math.min(selection.index,section.media.length);
     section.media[index]=$state.snapshot(selectedMedia);
    }
    draft=validatePreviewProject($state.snapshot(draft),media);
   }else{panelMessage='Choose an image or video from the library first.';return;}
   panel.close();
  }catch(error){panelMessage=error.message;}
 }
 async function selectMedia(item){
  choosingMedia=true;panelMessage='';
  try{
   const ratio=await new Promise((resolve,reject)=>{
    const element=item.kind==='image'?new Image():document.createElement('video');
    const timer=setTimeout(()=>{element.src='';reject(new Error('This media could not be read. Try another file.'));},8000);
    const success=()=>{clearTimeout(timer);const width=element.naturalWidth||element.videoWidth,height=element.naturalHeight||element.videoHeight;if(width&&height)resolve(width/height);else reject(new Error('The media dimensions are unavailable.'));};
    element.onload=success;element.onloadedmetadata=success;element.onerror=()=>{clearTimeout(timer);reject(new Error('This media could not be loaded.'));};
    element.preload='metadata';element.src=item.src;
   });
   selectedMedia={src:item.src,kind:item.kind,ratio,alt:item.label,caption:''};
  }catch(error){panelMessage=error.message;}finally{choosingMedia=false;}
 }
 function removeMedia(){
  if(selection.kind==='cover')draft.cover='';
  else{const section=draft.layout.sections.find(item=>item.id===selection.id);section.media=section.media.filter((_,index)=>index!==selection.index);}
  panel.close();
 }
 function moveMedia(direction){
  const section=draft.layout.sections.find(item=>item.id===selection.id);
  section.media=moveSection(section.media,selection.index,direction);panel.close();
 }
</script>

<section class="visual-creator" aria-label="AI project creator">
 <p class="intro">Tell me about your project. I’ll suggest a case study you can refine visually.</p>
 <form class="brief-form" method="POST" action="?/generateLayout" use:enhance={({cancel,formData})=>{
  if(generating || saving || (dirty && !window.confirm('Your current layout has unsaved changes. Generate a new layout anyway?'))){cancel();return;}generating=true;message='';
  const brief={title:String(formData.get('title') || '').trim(),description:String(formData.get('description') || '').trim(),category:formData.getAll('category')};
  return async({result})=>{
   try{
    if(result.type==='success'&&result.data?.layoutDraft){
     draft=validatePreviewProject(result.data.layoutDraft.project,media);sourceBrief=brief;draftKey=crypto.randomUUID();savedSlug='';revision='';savedSignature='';published=false;saveMessage='';questions=result.data.layoutDraft.questions;suggestions=result.data.layoutDraft.suggestions;removed=null;editing=true;await showWorkspace();
    }else if(result.type==='failure')message=result.data?.layoutMessage||'Your layout could not be generated. Your brief has been kept.';
    else await applyAction(result);
   }catch{message='The proposed layout could not be opened. Your brief and previous work have been kept.';}
   finally{generating=false;}
  };
 }}>
  <div class="brief-field">
   <label class="label" for="creator-name">Project name</label>
   <input id="creator-name" name="title" maxlength="160" required />
  </div>
  <fieldset class="brief-categories" aria-describedby="creator-categories-hint">
   <legend class="label">Project categories</legend>
   <p class="hint" id="creator-categories-hint">Choose one or more.</p>
   <div class="category-choices">
    {#each projectCategories as category}
     <label class="category-choice"><input type="checkbox" name="category" value={category} /><span>{category==='Motion Graphics'?'Animation / motion':category}</span></label>
    {/each}
   </div>
  </fieldset>
  <div class="brief-field">
   <label class="label" for="creator-brief">Tell me about your project</label>
   <textarea id="creator-brief" name="description" maxlength="5000" rows="6" required placeholder="What did you make? What was the idea, and how did you develop it?"></textarea>
  </div>
  <div class="brief-field">
   <label class="reference-label" for="creator-reference">Add a reference image <span>(optional)</span></label>
   <!-- No name attribute: this local file is deliberately excluded from the AI form data. -->
   <input id="creator-reference" type="file" accept="image/png,image/jpeg,image/webp" onchange={chooseReference} />
   {#if reference}<img class="reference-image" src={reference} alt="Your local reference" />{/if}
   {#if referenceMessage}<p class="hint" role="alert">{referenceMessage}</p>{/if}
  </div>
  <p class="hint">Your reference stays on this device. Only your project name, type and description are sent to AI.</p>
  <button class="button generate-layout" type="submit" disabled={!ready||generating}>{generating?'Creating your visual draft…':draft?'Generate a new layout':'Generate my project layout'}</button>
  {#if generating}<p class="hint" role="status">Choosing sections and arranging your case study…</p>{/if}
  {#if message}<p class="hint" role="alert">{message}</p>{/if}
 </form>
 {#if draft}<button class="button outline" type="button" onclick={showWorkspace}>{published?'View published preview':'Continue editing your project'}</button>{/if}
 <section class="saved-projects" aria-labelledby="saved-projects-title">
  <h3 class="label" id="saved-projects-title">Your projects</h3>
  {#if listMessage}<p class="hint" role="alert">{listMessage}</p>{/if}
  {#if saveMessage}<p class="hint" role="status">{saveMessage}</p>{/if}
  <h4 class="label">Private drafts</h4>
  {#if !savedDrafts.length}<p class="hint">No saved drafts yet. Choose Save Draft inside your project preview to keep it here.</p>{/if}
  {#each savedDrafts as project (project.slug)}
   <div class="saved-project-row"><span>{project.title}</span><form method="POST" action="?/openDraft" use:enhance={prepareOpen}><input type="hidden" name="slug" value={project.slug} /><button class="button outline" type="submit" disabled={saving}>Open draft</button></form></div>
  {/each}
  <h4 class="label">Published</h4>
  {#each publishedProjects as project (project.slug)}<div class="saved-project-row"><span>{project.title}</span><a class="button outline" href={`/work/${project.slug}`}>View project</a></div>{/each}
 </section>
 <noscript><p class="hint">Enable JavaScript to create and edit a visual project.</p></noscript>
</section>

<dialog class="visual-workspace" bind:this={workspace} aria-labelledby="visual-workspace-title">
 <div class="workspace-toolbar">
  <div><h2 class="label" id="visual-workspace-title">{published?'Published project':'Your project draft'}</h2><p class="hint">{published?'Your project is on the Work page.':dirty?'Unsaved changes. Choose Save Draft to keep your work privately.':'Draft saved privately. Reopen it from Your projects.'}</p></div>
  {#if saveMessage}<p class="hint" role="status">{saveMessage}</p>{/if}
  {#if inlineMessage}<p class="hint" role="alert">{inlineMessage}</p>{/if}
  <div class="workspace-actions">
   {#if !published}<button class="button outline" type="button" aria-pressed={editing} onclick={()=>{editing=!editing;}}>{editing?'Preview finished page':'Edit page'}</button>{/if}
   <button class="button outline" type="button" aria-pressed={mode==='desktop'} onclick={()=>{mode='desktop';}}>Desktop</button>
   <button class="button outline" type="button" aria-pressed={mode==='mobile'} onclick={()=>{mode='mobile';}}>Mobile</button>
   {#if editing}<button class="button outline" type="button" onclick={()=>openPanel({kind:'add'})}>Add section</button><button class="button outline" type="button" onclick={()=>openPanel({kind:'project'})}>Project details</button>{/if}
   {#if removed}<button class="button outline" type="button" onclick={()=>{draft.layout.sections.splice(removed.index,0,removed.section);removed=null;}}>Undo remove</button>{/if}
   {#if !published}
    <form method="POST" action="?/saveLayout" use:enhance={prepareSave}><input type="hidden" name="intent" value="draft" /><button class="button" type="submit" disabled={saving}>{saving?'Saving…':'Save Draft'}</button></form>
    <button class="button" type="button" disabled={saving} onclick={()=>{approval=false;saveMessage='';publishDialog.showModal();}}>Add to Portfolio</button>
   {:else}<a class="button" href={`/work/${savedSlug}`}>View project</a>{/if}
   <button class="return-button" type="button" onclick={closeWorkspace}>Return to Studio</button>
  </div>
  {#if questions.length}<details class="questions"><summary>A few details to consider</summary><ul>{#each questions as question}<li>{question}</li>{/each}</ul></details>{/if}
 </div>
 <div class="page-viewport">
  {#if draft}<iframe bind:this={frame} src="/studio/preview" title="Visual portfolio draft" style:width={mode==='mobile'?'390px':'1440px'} onload={sendDraft}></iframe>{/if}
 </div>
</dialog>

<dialog class="edit-panel" bind:this={publishDialog} aria-labelledby="publish-project-title">
 <h2 class="label" id="publish-project-title">Add to Portfolio</h2>
 <p>This makes the complete project visible on your Work page. Review the desktop and mobile previews before publishing.</p>
 <form method="POST" action="?/saveLayout" use:enhance={prepareSave}>
  <input type="hidden" name="intent" value="publish" />
  <label class="category-choice"><input type="checkbox" bind:checked={approval} required /><span>I have reviewed this project and want to publish it.</span></label>
  {#if saveMessage}<p class="hint" role="alert">{saveMessage}</p>{/if}
  <div class="workspace-actions"><button class="button" type="submit" disabled={!approval || saving}>{saving?'Publishing…':'Confirm Add to Portfolio'}</button><button class="button outline" type="button" disabled={saving} onclick={()=>publishDialog.close()}>Keep editing</button></div>
 </form>
</dialog>

<dialog class="edit-panel" bind:this={panel} aria-labelledby="visual-edit-title">
 <h2 class="label" id="visual-edit-title">{selection?.kind==='add'?'Add a section':selection?.kind==='section'?'Edit this section':selection?.kind==='project'?'Project details':desiredKind==='video'?'Choose a video':'Choose an image'}</h2>
 {#if selection?.kind==='add'}
  <div class="add-choices">{#each [['introduction','Introduction'],['creative-process','Process'],['image-gallery','Images'],['video-showcase','Video']] as [type,label]}<button class="button outline" type="button" onclick={()=>addSection(type)}>{label}</button>{/each}</div>
 {:else if selection?.kind==='section'&&sectionEdit}
  <label class="label" for="visual-heading">Heading</label><input id="visual-heading" maxlength="160" bind:value={sectionEdit.heading} />
  <label class="label" for="visual-description">Description</label><textarea id="visual-description" maxlength="2000" rows="5" bind:value={sectionEdit.description}></textarea>
  <details><summary>More options</summary><label class="label" for="visual-more-text">Additional text</label><textarea id="visual-more-text" maxlength="5000" rows="4" bind:value={sectionEdit.text}></textarea><label class="label" for="visual-layout">Presentation</label><span class="select-control"><select id="visual-layout" bind:value={sectionEdit.layout}>{#each sectionLayouts as layout}<option value={layout.value}>{layout.label}</option>{/each}</select><span class="select-arrow" aria-hidden="true">⌄</span></span></details>
  {#if suggestions[selection.id]?.length}<p class="hint">Useful material to add:</p><ul>{#each suggestions[selection.id] as suggestion}<li>{suggestion}</li>{/each}</ul>{/if}
 {:else if selection?.kind==='project'&&projectEdit}
  {#each [['title','Project name'],['description','Introduction'],['client','Client'],['year','Year']] as [key,label]}<label class="label" for={`visual-${key}`}>{label}</label><input id={`visual-${key}`} bind:value={projectEdit[key]} />{/each}
  <details><summary>More project details</summary>{#each [['context','Creative brief'],['rolesText','Your role — one per line'],['toolsText','Tools — one per line'],['summary','Reviewed summary']] as [key,label]}<label class="label" for={`visual-${key}`}>{label}</label><textarea id={`visual-${key}`} rows="3" bind:value={projectEdit[key]}></textarea>{/each}</details>
 {:else if selection?.kind==='cover'||selection?.kind==='media'}
  <p class="hint">Choose an existing public portfolio file. These files are already public; no upload or AI image sharing takes place.</p>
  <div class="media-library">{#each availableMedia as item}<button class="asset-choice" type="button" disabled={choosingMedia} onclick={()=>selectMedia(item)}>{#if item.kind==='image'}<img src={item.src} alt={item.label} loading="lazy" />{:else}<video src={item.src} muted preload="metadata" aria-label={item.label}><track kind="captions" /></video>{/if}<span>{item.label}</span></button>{/each}</div>
  {#if !availableMedia.length}<p class="hint">No matching files are available in the public project library yet.</p>{/if}
  {#if choosingMedia}<p class="hint" role="status">Reading the original media proportions…</p>{/if}
  {#if selectedMedia}<p class="hint">Selected: {selectedMedia.src.split('/').pop()}</p>{#if selection.kind==='media'}<label class="label" for="media-alt">Describe this media for accessibility</label><input id="media-alt" maxlength="500" bind:value={selectedMedia.alt} /><label class="label" for="media-caption">Caption (optional)</label><input id="media-caption" maxlength="500" bind:value={selectedMedia.caption} />{/if}{/if}
  {#if selection.kind==='media'&&draft?.layout.sections.find(s=>s.id===selection.id)?.media[selection.index]}<div class="workspace-actions"><button class="button outline" type="button" onclick={()=>moveMedia(-1)}>Move earlier</button><button class="button outline" type="button" onclick={()=>moveMedia(1)}>Move later</button><button class="button outline" type="button" onclick={removeMedia}>Remove media</button></div>{/if}
 {/if}
 {#if panelMessage}<p class="hint" role="alert">{panelMessage}</p>{/if}
 <div class="workspace-actions">{#if selection?.kind!=='add'}<button class="button" type="button" disabled={choosingMedia} onclick={applyEdits}>Apply changes</button>{/if}<button class="button outline" type="button" onclick={()=>panel.close()}>Cancel</button></div>
</dialog>

<style>
 .visual-creator{display:flex;flex-direction:column;align-items:flex-start;row-gap:24px;width:100%;}
 .intro{margin-top:0;margin-bottom:0;text-align:left;}
 .saved-projects{width:100%;margin-top:24px;padding-top:24px;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
 .saved-projects h3{margin-top:0;margin-bottom:20px;}
 .saved-projects h4{margin-top:24px;margin-bottom:12px;}
 .saved-project-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;column-gap:16px;row-gap:12px;padding-top:12px;padding-bottom:12px;}
 .saved-project-row>span{min-width:0;overflow-wrap:anywhere;}
 .saved-project-row .button{font-size:12px;}
 .brief-form{display:flex;flex-direction:column;align-items:stretch;row-gap:24px;width:100%;}
 .brief-field{display:flex;flex-direction:column;align-items:stretch;row-gap:8px;width:100%;min-width:0;}
 .brief-categories{min-width:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;}
 .brief-categories legend{padding-left:0;padding-right:0;margin-bottom:8px;}
 .category-choices{display:flex;flex-wrap:wrap;column-gap:24px;row-gap:8px;margin-top:8px;}
 .category-choice{display:flex;align-items:center;column-gap:10px;min-height:44px;cursor:pointer;}
 .category-choice input{width:18px;height:18px;min-height:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;accent-color:var(--ink);flex-shrink:0;}
 input,textarea,select{width:100%;min-width:0;box-sizing:border-box;min-height:44px;padding-top:12px;padding-right:14px;padding-bottom:12px;padding-left:14px;border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0;background-color:#fff;color:var(--ink);font-family:var(--sans);font-size:inherit;line-height:1.35;}
 select{appearance:none;padding-right:42px;}
 .select-control{position:relative;display:block;width:100%;min-width:0;}
 .select-arrow{position:absolute;top:50%;right:16px;transform:translateY(-56%);pointer-events:none;color:var(--ink);font-family:'futura-pt',Futura,'Century Gothic',Arial,sans-serif;font-size:24px;font-weight:400;line-height:1;}
 textarea{resize:vertical;}
 .generate-layout{align-self:flex-start;margin-top:0;max-width:100%;white-space:normal;min-width:0;}
 .reference-label,.hint,.questions{font-size:var(--studio-caption-size,15px);line-height:1.4;}
 .hint{margin-top:0;margin-bottom:0;}
 .reference-image{max-width:100%;max-height:180px;object-fit:contain;}
 .visual-workspace,.edit-panel{color:var(--ink);background-color:#fff;border-top-width:var(--hairline);border-right-width:var(--hairline);border-bottom-width:var(--hairline);border-left-width:var(--hairline);border-top-style:solid;border-right-style:solid;border-bottom-style:solid;border-left-style:solid;border-top-color:var(--line);border-right-color:var(--line);border-bottom-color:var(--line);border-left-color:var(--line);}
 .visual-workspace{width:calc(100vw - 24px);max-width:1700px;height:calc(100dvh - 24px);max-height:none;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;}
 .visual-workspace[open]{display:flex;flex-direction:column;}
 dialog::backdrop{background-color:rgb(28 28 28 / 30%);}
 .workspace-toolbar{padding-top:16px;padding-right:20px;padding-bottom:16px;padding-left:20px;border-bottom-width:var(--hairline);border-bottom-style:solid;border-bottom-color:var(--line);display:flex;flex-direction:column;row-gap:12px;}
 .workspace-toolbar h2{margin-top:0;margin-bottom:6px;}
 .workspace-actions{display:flex;flex-wrap:wrap;column-gap:10px;row-gap:10px;align-items:center;}
 .workspace-actions button{font-size:12px;}
 [aria-pressed='true']{background-color:var(--lilac);}
 .return-button{background-color:transparent;color:var(--ink);border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;text-decoration-line:underline;text-transform:none;font-weight:400;}
 .page-viewport{display:flex;justify-content:safe center;flex-grow:1;min-height:0;overflow-x:auto;overflow-y:hidden;background-color:#f8f8f8;}
 iframe{height:100%;flex-shrink:0;max-width:none;border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;background-color:#fff;}
 .edit-panel{width:calc(100vw - 32px);max-width:560px;max-height:85dvh;padding-top:24px;padding-right:24px;padding-bottom:24px;padding-left:24px;overflow-y:auto;}
 .edit-panel[open]{display:flex;flex-direction:column;row-gap:14px;}
 .edit-panel h2{margin-top:0;margin-bottom:6px;}
 summary{cursor:pointer;}
 details label{display:block;margin-top:16px;}
 .media-library{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;row-gap:12px;max-height:300px;overflow-y:auto;}
 .asset-choice{display:flex;flex-direction:column;align-items:stretch;min-width:0;white-space:normal;background-color:#fff;font-size:12px;font-weight:400;text-transform:none;padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px;}
 .asset-choice img,.asset-choice video{width:100%;height:90px;object-fit:contain;}
 .asset-choice span{overflow-wrap:anywhere;}
 .add-choices{display:flex;flex-wrap:wrap;column-gap:12px;row-gap:12px;}
 @media(max-width:700px){.visual-workspace{width:100vw;height:100dvh;max-width:none;border-top-width:0;border-right-width:0;border-bottom-width:0;border-left-width:0;}.workspace-toolbar{padding-right:12px;padding-left:12px;}}
</style>
