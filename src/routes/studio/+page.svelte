<script>
 import VisualProjectCreator from '#lib/components/VisualProjectCreator.svelte';
 import ProjectBuilder from '#lib/components/ProjectBuilder.svelte';
 import { enhance } from '$app/forms';
 let builderSections = $state([]);
 let savingProject = $state(false);
 let generatingSummary = $state(false);
 import FontQuoteTool from '#lib/components/FontQuoteTool.svelte';
 import { projectCategories, projectTypes, projectFields } from '#lib/project-form';
 let { data, form } = $props();
</script>

<svelte:head>
 <title>Studio — Jenna Slikkerveer</title>
 <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main" class="studio fade" class:workspace={!!data.user}>
 <section class="studio-panel" aria-label="Studio">
  {#if data.user}
  <h1 class="studio-title">Studio</h1>
  {#if form?.message}<p class="message" role="alert">{form.message}</p>{/if}
  <div class="studio-columns">
  <section class="add-project" aria-labelledby="add-project-title">
   <h2 id="add-project-title">Add a project</h2>
    <VisualProjectCreator media={data.builderMedia || []} />
    {#if data.createdProject}
     <p class="success" role="status">Project saved: <a href={`/work/${data.createdProject.slug}`}>{data.createdProject.title} — View project</a></p>
     {#if data.createdProject.summary}
      <section class="studio-summary" aria-labelledby="studio-summary-title">
       <h3 class="label" id="studio-summary-title">Summary (AI-generated)</h3>
       <p>{data.createdProject.summary}</p>
       <p class="hint">Review this AI-generated text for accuracy.</p>
      </section>
     {:else}
      <p class="hint" role="status">Your project is saved without an AI summary.</p>
     {/if}
    {/if}
    <details class="legacy-project-options"><summary>More project options</summary>
    <p class="hint">The original form and AI summary tool are available here. Saving this form publishes a simple project.</p>
    <form method="POST" action="?/createProject" use:enhance={({ cancel, action }) => {
     if (savingProject || generatingSummary) { cancel(); return; }
     const generating = action.search === '?/generateSummary';
     generatingSummary = generating;
     savingProject = !generating;
     return async ({ update }) => {
      // Draft generation keeps the current form; publishing resets it after success.
      try { await update({ reset: !generating }); } finally {
       savingProject = false;
       generatingSummary = false;
      }
     };
    }}>
     {#if form?.projectMessage}<p class="message" role="alert">{form.projectMessage}</p>{/if}
     {#each projectFields as field}
      <div class="field">
       <label class="label" for={`project-${field.name}`}>{field.label}{field.required ? ' *' : ''}</label>
       {#if field.multiline}
        <textarea id={`project-${field.name}`} name={field.name} required={field.required} maxlength={field.max} rows={field.name === 'body' ? 8 : 3} value={form?.values?.[field.name] || ''} aria-invalid={form?.errors?.[field.name] ? 'true' : undefined} aria-describedby={form?.errors?.[field.name] ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined}></textarea>
       {:else}
        <input id={`project-${field.name}`} name={field.name} type="text" inputmode={field.name === 'year' ? 'numeric' : undefined} required={field.required} maxlength={field.max} value={form?.values?.[field.name] || ''} aria-invalid={form?.errors?.[field.name] ? 'true' : undefined} aria-describedby={form?.errors?.[field.name] ? `${field.name}-error` : undefined} />
       {/if}
       {#if field.hint}<p class="hint" id={`${field.name}-hint`}>{field.hint}</p>{/if}
       {#if form?.errors?.[field.name]}<p class="field-error" id={`${field.name}-error`}>{form.errors[field.name]}</p>{/if}
      </div>
      {#if field.name === 'context'}
       <div class="field ai-summary" aria-busy={generatingSummary}>
        <button class="button" type="submit" formaction="?/generateSummary" formnovalidate disabled={savingProject || generatingSummary}>
         {generatingSummary ? 'Generating AI summary…' : 'Generate AI Summary'}
        </button>
        <p class="hint">Generate an optional draft from your description and context. Review, edit, or generate again before saving.</p>
        {#if generatingSummary}<p class="hint" role="status">Generating your summary…</p>{/if}
        {#if form?.summaryMessage}<p class="hint" role="status">{form.summaryMessage}</p>{/if}
        <label class="label" for="project-summary">AI summary — editable</label>
        <textarea id="project-summary" name="summary" rows="5" maxlength="2000" value={form?.values?.summary || ''} readonly={generatingSummary} aria-invalid={form?.errors?.summary ? 'true' : undefined} aria-describedby="summary-hint"></textarea>
        <p class="hint" id="summary-hint">The text in this field is saved with your project. Saving does not generate a summary.</p>
        {#if form?.errors?.summary}<p class="field-error">{form.errors.summary}</p>{/if}
       </div>
      {/if}
      {#if field.name === 'title'}
       <fieldset class="field categories" aria-describedby={form?.errors?.category ? 'category-error' : 'category-hint'}>
        <legend class="label">Category *</legend>
        <p class="hint" id="category-hint">Choose one or more categories.</p>
        {#each projectCategories as category}
         <label class="category-option">
          <input type="checkbox" name="category" value={category} checked={form?.values?.category?.includes(category) || false} aria-invalid={form?.errors?.category ? 'true' : undefined} />
          <span>{category}</span>
         </label>
        {/each}
        {#if form?.errors?.category}<p class="field-error" id="category-error">{form.errors.category}</p>{/if}
       </fieldset>
       <div class="field">
        <label class="label" for="project-type">Type *</label>
        <span class="select-control">
         <select id="project-type" name="type" required value={form?.values?.type || 'landscape'} aria-invalid={form?.errors?.type ? 'true' : undefined} aria-describedby={form?.errors?.type ? 'type-error' : undefined}>
          {#each projectTypes as type}<option value={type}>{type === 'portrait' ? 'Portrait (9:16)' : 'Landscape (16:9)'}</option>{/each}
         </select>
         <span class="select-arrow" aria-hidden="true">⌄</span>
        </span>
        {#if form?.errors?.type}<p class="field-error" id="type-error">{form.errors.type}</p>{/if}
       </div>
      {/if}
     {/each}
     <ProjectBuilder bind:sections={builderSections} />
     {#if builderSections.length}<p class="hint" role="status">This section layout is preview-only in Stage A. It cannot be published yet; refreshing or leaving Studio clears these unsaved sections.</p>{/if}
     <button class="button" type="submit" disabled={savingProject || generatingSummary || builderSections.length > 0}>{savingProject ? 'Saving project…' : 'Save project'}</button>
    </form>
    </details>
   </section>
   <section class="comments-section" id="comments" aria-labelledby="comments-title">
    <h2 id="comments-title">Add a comment</h2>
    {#if data.commentLoadError}<p role="alert">{data.commentLoadError}</p>{/if}
    {#if data.commentProjects.length}
     <form method="GET" action="/studio#comments">
      <div class="field">
       <label class="label" for="comment-project">Project</label>
       <span class="select-control">
        <select id="comment-project" name="project" required value={data.selectedCommentProject?.slug || ''}>
         <option value="" disabled>Choose a project</option>
         {#each data.commentProjects as project}<option value={project.slug}>{project.title}</option>{/each}
        </select>
        <span class="select-arrow" aria-hidden="true">⌄</span>
       </span>
      </div>
      <button class="button outline" type="submit">View comments</button>
     </form>
    {:else if !data.commentLoadError}
     <p>No projects are available yet.</p>
    {/if}
    {#if data.selectedCommentProject}
     <h3 class="label selected-project">{data.selectedCommentProject.title}</h3>
     {#if data.commentSaved && !form?.commentMessage}<p class="success" role="status">Comment saved.</p>{/if}
     <form method="POST" action={`?/addComment&project=${encodeURIComponent(data.selectedCommentProject.slug)}#comments`}>
      <input type="hidden" name="project" value={data.selectedCommentProject.slug} />
      {#if form?.commentMessage}<p class="message" role="alert">{form.commentMessage}</p>{/if}
      {#if form?.commentErrors?.project}<p class="field-error" role="alert">{form.commentErrors.project}</p>{/if}
      <div class="field">
       <label class="label" for="comment-name">Name</label>
       <input id="comment-name" name="name" type="text" required maxlength="80" autocomplete="name" value={form?.commentValues?.name || ''} aria-invalid={form?.commentErrors?.name ? 'true' : undefined} aria-describedby={form?.commentErrors?.name ? 'comment-name-error' : undefined} />
       {#if form?.commentErrors?.name}<p class="field-error" id="comment-name-error">{form.commentErrors.name}</p>{/if}
      </div>
      <div class="field">
       <label class="label" for="comment-message">Comment</label>
       <textarea id="comment-message" name="message" required maxlength="2000" rows="5" value={form?.commentValues?.message || ''} aria-invalid={form?.commentErrors?.message ? 'true' : undefined} aria-describedby={form?.commentErrors?.message ? 'comment-message-error' : undefined}></textarea>
       {#if form?.commentErrors?.message}<p class="field-error" id="comment-message-error">{form.commentErrors.message}</p>{/if}
      </div>
      <button class="button" type="submit">Save comment</button>
     </form>
     {#if form?.deleteMessage}<p class="message" role="alert">{form.deleteMessage}</p>{/if}
     {#if data.commentDeleted}<p class="success" role="status">Comment deleted.</p>{/if}
     <div class="comment-list" aria-label="Saved comments">
      {#each data.comments as comment (comment.id)}
       <article class="comment">
        <p class="comment-project">Project: {data.selectedCommentProject.title}</p>
        <h3 class="label">{comment.name}</h3>
        <time datetime={comment.created}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm' }).format(new Date(comment.created))}</time>
        <p class="comment-text">{comment.message}</p>
        <form class="delete-comment" method="POST" action={`?/deleteComment&project=${encodeURIComponent(data.selectedCommentProject.slug)}#comments`} onsubmit={(event) => { if (!window.confirm('Delete this comment? This cannot be undone.')) event.preventDefault(); }}>
         <input type="hidden" name="project" value={data.selectedCommentProject.slug} />
         <input type="hidden" name="commentId" value={comment.id} />
         <button class="button outline" type="submit">Delete comment</button>
        </form>
       </article>
      {:else}
       <p>No comments for this project yet.</p>
      {/each}
     </div>
    {/if}
   </section>
    </div>
  {:else}
   <form method="POST" action="?/login">
    <div class="field">
     <label class="label" for="username">Username</label>
     <input id="username" name="username" type="text" autocomplete="username" required minlength="3" maxlength="40" autocapitalize="none" spellcheck="false" />
    </div>
    <div class="field">
     <label class="label" for="password">Password</label>
     <input id="password" name="password" type="password" autocomplete="current-password" required />
    </div>
    {#if form?.message}<p class="message" role="alert">{form.message}</p>{/if}
    <button class="button" type="submit">Sign in</button>
   </form>
  {/if}
 </section>
 {#if data.user}
  <aside class="studio-sidebar" aria-label="Creative tools">
   <div class="studio-tools">
    <FontQuoteTool result={form} />
   </div>
  </aside>
 {/if}
</main>

<style>
 /* Use the homepage's responsive type scale while keeping form hints secondary. */
 .studio {
  --studio-caption-size:15px;
  --studio-button-size:13px;
  --studio-label-size:14px;
  --studio-label-line:1.25;
  --studio-heading-size:clamp(28px,4vw,36px);
  font-family:var(--sans);
  font-size:clamp(16px,2.1vw,18px);
  font-weight:400;
  line-height:1.4;
 }
 .studio :global(p){line-height:1.3;}
 .studio :global(h2){font-size:var(--studio-heading-size);line-height:1.2;}
 .studio :global(.label){font-size:var(--studio-label-size);line-height:var(--studio-label-line);}
 .studio :global(.button){font-family:var(--sans);font-size:var(--studio-button-size);line-height:1.2;}
 @media(min-width:1001px){
  .studio {
   --studio-caption-size:max(14px,18rem);
   --studio-button-size:16rem;
   --studio-label-size:20rem;
   --studio-label-line:1.25;
   --studio-heading-size:45rem;
   font-size:24rem;
   line-height:1.3;
  }
 }
 @media(min-width:1001px) and (max-width:1439px){
  .studio {
   --studio-button-size:calc(13px - (100vw - 1000px) * 1 / 440);
   --studio-label-size:calc(14px + (100vw - 1000px) * 1 / 440);
   --studio-heading-size:clamp(28px,2.34375vw,33.75px);
   font-size:clamp(15px,1.25vw,18px);
  }
 }
 @media(max-width:700px){
  .studio {
   --studio-caption-size:14px;
   --studio-button-size:calc(10px + 1pt);
   --studio-label-size:15px;
   --studio-heading-size:clamp(26px,6.6vw,32px);
   font-size:calc(15px + 1pt);
   line-height:1.3;
  }
 }
 .studio { flex-grow: 1; display: flex; flex-direction: column; align-items: center; padding-top: 64px; padding-right: 7%; padding-bottom: 100px; padding-left: 7%; }
 /* Keep the Studio tools aligned with the shared header and footer columns. */
 @media(min-width:1001px){
  :global(body:has(.studio.workspace)){--sidebar:max(220px,15.739583%);}
 }
 .studio.workspace{
  display:grid;
  grid-template-columns:minmax(0,1fr) var(--sidebar);
  align-items:stretch;
  min-height:calc(100svh - var(--header) - 90px);
  padding-top:0;
  padding-right:0;
  padding-bottom:0;
  padding-left:0;
 }
 .workspace .studio-panel{
  box-sizing:border-box;
  width:min(1100rem,calc(100% - 80rem));
  max-width:none;
  margin-top:78rem;
  margin-right:auto;
  margin-bottom:64rem;
  margin-left:auto;
 }
 .studio-title{
  margin-top:0;
  margin-right:0;
  margin-bottom:50rem;
  margin-left:0;
  font-family:var(--serif);
  font-size:75rem;
  font-weight:400;
  line-height:1.2;
  text-align:center;
 }
 .studio-columns{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  align-items:stretch;
  column-gap:64rem;
  row-gap:40rem;
 }
 .studio-sidebar{
  align-self:stretch;
  min-width:0;
  width:100%;
  border-left-width:var(--hairline);
  border-left-style:solid;
  border-left-color:var(--line);
  background-color:#fff;
 }
 .studio-tools{
  position:sticky;
  top:var(--header);
  max-height:calc(100dvh - var(--header));
  overflow-y:auto;
  padding-top:55rem;
  padding-right:55rem;
  padding-bottom:40rem;
  padding-left:55rem;
  scrollbar-width:thin;
 }
 @media(min-width:1201px){
  main.studio.workspace .studio-tools :global(.specimen){
   min-height:142rem;
   margin-bottom:24rem;
   padding-top:14rem;
   padding-right:14rem;
   padding-bottom:14rem;
   padding-left:14rem;
   row-gap:12rem;
  }
 }
 @media(max-width:1200px){
  .studio.workspace{display:block;min-height:0;}
  .workspace .studio-panel{width:min(900px,calc(100% - 48px));margin-top:56px;margin-right:auto;margin-bottom:64px;margin-left:auto;}
  .studio-title{font-size:clamp(44px,6vw,60px);margin-bottom:36px;}
  .studio-columns{column-gap:32px;row-gap:32px;}
  .studio-columns .add-project,.studio-columns .comments-section{padding-top:24px;padding-right:24px;padding-bottom:24px;padding-left:24px;}
  .studio-sidebar{border-left-width:0;border-top-width:var(--hairline);border-top-style:solid;border-top-color:var(--line);}
  .studio-tools{position:static;max-height:none;overflow-y:visible;padding-top:40px;padding-right:32px;padding-bottom:48px;padding-left:32px;}
 }
 @media(max-width:1100px){
  .studio-columns{grid-template-columns:minmax(0,1fr);}
 }
 @media(max-width:700px){
  .workspace .studio-panel{width:calc(100% - 32px);margin-top:48px;margin-bottom:48px;}
  .studio-title{font-size:48px;margin-bottom:28px;}
  .studio-columns{row-gap:24px;}
  .studio-columns .add-project,.studio-columns .comments-section{padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px;}
  .studio-tools{padding-top:32px;padding-right:16px;padding-bottom:40px;padding-left:16px;}
 }
 .legacy-project-options{width:100%;margin-top:32px;}
 .legacy-project-options>summary{cursor:pointer;font-size:var(--studio-caption-size);margin-bottom:20px;}
 .legacy-project-options>p{margin-bottom:24px;}
 .studio-panel { width: 100%; max-width: 440px; }
 p { margin-bottom: 24px; }
 form { display: flex; flex-direction: column; align-items: flex-start; row-gap: 24px; }
 .ai-summary .button { align-self: flex-start; }
 .field { width: 100%; display: flex; flex-direction: column; row-gap: 10px; }
 input, select, textarea { box-sizing: border-box; width: 100%; min-height: 44px; padding-top: 12px; padding-right: 14px; padding-bottom: 12px; padding-left: 14px; border-top-width: var(--hairline); border-right-width: var(--hairline); border-bottom-width: var(--hairline); border-left-width: var(--hairline); border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--line); border-right-color: var(--line); border-bottom-color: var(--line); border-left-color: var(--line); border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0; background-color: white; color: var(--ink); font-family: var(--sans); font-size: inherit; font-weight: 400; line-height: 1.3; }
 select { appearance: none; padding-right: 42px; }
 .select-control{position:relative;display:block;width:100%;min-width:0;}
 .select-arrow{position:absolute;top:50%;right:16px;transform:translateY(-56%);pointer-events:none;color:var(--ink);font-family:'futura-pt',Futura,'Century Gothic',Arial,sans-serif;font-size:24px;font-weight:400;line-height:1;}
 /* Browser autofill paints over background-color; cover its tint inside the fields. */
 #username:autofill,
 #password:autofill{
  box-shadow:inset 0 0 0 1000px #fff;
  color:var(--ink);
  caret-color:var(--ink);
 }
 #username:-webkit-autofill,
 #password:-webkit-autofill{
  box-shadow:inset 0 0 0 1000px #fff;
  -webkit-text-fill-color:var(--ink);
  caret-color:var(--ink);
 }
 .categories { min-width: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; padding-top: 0; padding-right: 0; padding-bottom: 0; padding-left: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; }
 .categories legend { margin-bottom: 10px; }
 .category-option { display: flex; align-items: center; column-gap: 12px; min-height: 44px; cursor: pointer; }
 .category-option input { width: 20px; height: 20px; min-height: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; flex-shrink: 0; accent-color: var(--ink); }
 .message { margin-bottom: 0; }
 .add-project, .comments-section {
  min-width:0;
  margin-top:0;
  padding-top:36rem;
  padding-right:36rem;
  padding-bottom:36rem;
  padding-left:36rem;
  border-top-width:var(--hairline);
  border-right-width:var(--hairline);
  border-bottom-width:var(--hairline);
  border-left-width:var(--hairline);
  border-top-style:solid;
  border-right-style:solid;
  border-bottom-style:solid;
  border-left-style:solid;
  border-top-color:#aaa;
  border-right-color:#aaa;
  border-bottom-color:#aaa;
  border-left-color:#aaa;
  background-color:#fff;
 }
 .add-project h2, .comments-section h2 { margin-bottom: 20px; }
 .add-project h2 { text-align:left; }
 .hint { margin-bottom: 0; font-size: var(--studio-caption-size); line-height: 1.4; }
 .add-project > .hint { margin-bottom: 24px; }
 textarea { resize: vertical; line-height: 1.3; }
 .field-error { margin-bottom: 0; font-size: var(--studio-caption-size); }
 [aria-invalid="true"] { border-top-color: var(--ink); border-right-color: var(--ink); border-bottom-color: var(--ink); border-left-color: var(--ink); background-color: var(--pink); }
 .success { padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px; background-color: var(--pink); }
 .studio-summary { margin-bottom: 24px; }
 .studio-summary h3 { margin-bottom: 12px; }
 .comments-section { scroll-margin-top: calc(var(--header) + 24px); }
 .selected-project { margin-top: 32px; margin-right: 0; margin-bottom: 24px; margin-left: 0; }
 .comment-list { margin-top: 32px; }
 .comment { padding-top: 24px; padding-bottom: 24px; border-top-width: var(--hairline); border-top-style: solid; border-top-color: var(--line); }
 .comment h3 { margin-top: 0; margin-bottom: 8px; }
 .comment time { display: block; font-size: var(--studio-caption-size); margin-bottom: 12px; }
 .comment-project { font-size: var(--studio-caption-size); margin-bottom: 12px; overflow-wrap: anywhere; }
 .delete-comment { margin-top: 16px; }
 .comment-text { white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 0; }
 .success a { text-decoration-line: underline; }
 @media(max-width:700px){
  .studio{padding-top:40px;padding-bottom:64px;}
  .studio .add-project,.studio .comments-section{padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px;}
 }
</style>
