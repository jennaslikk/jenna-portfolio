<script>
 import { projectCategories, projectTypes, projectFields } from '#lib/project-form';
 let { data, form } = $props();
</script>

<svelte:head>
 <title>Studio — Jenna Slikkerveer</title>
 <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main" class="studio fade">
 <section class="studio-panel" aria-labelledby="studio-title">
  <h1 id="studio-title">Studio</h1>
  {#if data.user}
   <p>Signed in as {data.user.username}</p>
   {#if form?.message}<p class="message" role="alert">{form.message}</p>{/if}
   <form method="POST" action="?/logout">
    <button class="button" type="submit">Sign out</button>
   </form>
   <section class="add-project" aria-labelledby="add-project-title">
    <h2 id="add-project-title">Add a project</h2>
    <p class="hint">Saving publishes the project on Work. New projects start with an empty artwork placeholder.</p>
    {#if data.createdProject}
     <p class="success" role="status">Project saved: <a href={`/work/${data.createdProject.slug}`}>{data.createdProject.title} — View project</a></p>
    {/if}
    <form method="POST" action="?/createProject">
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
        <select id="project-type" name="type" required value={form?.values?.type || 'landscape'} aria-invalid={form?.errors?.type ? 'true' : undefined} aria-describedby={form?.errors?.type ? 'type-error' : undefined}>
         {#each projectTypes as type}<option value={type}>{type === 'portrait' ? 'Portrait (9:16)' : 'Landscape (16:9)'}</option>{/each}
        </select>
        {#if form?.errors?.type}<p class="field-error" id="type-error">{form.errors.type}</p>{/if}
       </div>
      {/if}
     {/each}
     <button class="button" type="submit">Save project</button>
    </form>
   </section>
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
</main>

<style>
 .studio { flex-grow: 1; display: grid; align-items: center; justify-items: center; padding-top: 64px; padding-right: 7%; padding-bottom: 100px; padding-left: 7%; }
 .studio-panel { width: 100%; max-width: 440px; }
 h1 { margin-bottom: 32px; }
 p { margin-bottom: 24px; }
 form { display: flex; flex-direction: column; align-items: flex-start; row-gap: 24px; }
 .field { width: 100%; display: flex; flex-direction: column; row-gap: 10px; }
 input, select, textarea { box-sizing: border-box; width: 100%; min-height: 44px; padding-top: 12px; padding-right: 14px; padding-bottom: 12px; padding-left: 14px; border-top-width: var(--hairline); border-right-width: var(--hairline); border-bottom-width: var(--hairline); border-left-width: var(--hairline); border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--line); border-right-color: var(--line); border-bottom-color: var(--line); border-left-color: var(--line); border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0; background-color: white; color: var(--ink); font-family: var(--sans); font-size: 18px; }
 .categories { min-width: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; padding-top: 0; padding-right: 0; padding-bottom: 0; padding-left: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; }
 .categories legend { margin-bottom: 10px; }
 .category-option { display: flex; align-items: center; column-gap: 12px; min-height: 44px; cursor: pointer; }
 .category-option input { width: 20px; height: 20px; min-height: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; flex-shrink: 0; accent-color: var(--ink); }
 .message { margin-bottom: 0; }
 .add-project { margin-top: 40px; padding-top: 32px; border-top-width: var(--hairline); border-top-style: solid; border-top-color: var(--line); }
 .add-project h2 { margin-bottom: 20px; }
 .hint { margin-bottom: 0; font-size: 15px; line-height: 1.4; }
 .add-project > .hint { margin-bottom: 24px; }
 textarea { resize: vertical; line-height: 1.5; }
 .field-error { margin-bottom: 0; font-size: 15px; }
 [aria-invalid="true"] { border-top-color: var(--ink); border-right-color: var(--ink); border-bottom-color: var(--ink); border-left-color: var(--ink); background-color: var(--pink); }
 .success { padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px; background-color: var(--pink); }
 .success a { text-decoration-line: underline; }
 @media (max-width: 700px) { .studio { padding-top: 40px; padding-bottom: 64px; } }
</style>
