<script>
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
 input { box-sizing: border-box; width: 100%; min-height: 44px; padding-top: 12px; padding-right: 14px; padding-bottom: 12px; padding-left: 14px; border-top-width: var(--hairline); border-right-width: var(--hairline); border-bottom-width: var(--hairline); border-left-width: var(--hairline); border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--line); border-right-color: var(--line); border-bottom-color: var(--line); border-left-color: var(--line); border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0; background-color: white; color: var(--ink); font-family: var(--sans); font-size: 18px; }
 .message { margin-bottom: 0; }
 @media (max-width: 700px) { .studio { padding-top: 40px; padding-bottom: 64px; } }
</style>
