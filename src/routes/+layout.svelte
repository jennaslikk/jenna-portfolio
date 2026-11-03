<script>
 import '../app.css';
 import { setContext } from 'svelte';
 import { writable } from 'svelte/store';
 // Each rendered layout owns its footer state, including during server rendering.
 const workHasMultipleRows = writable(true);
 setContext('workHasMultipleRows', workHasMultipleRows);
 import { page } from '$app/stores';
 import { site } from '#lib/site';

 // Use the actual navigation position so sidebar content shares its left edge.
 function alignSidebar(navigation) {
  const workLink = navigation.querySelector('a');
  const contactLink = navigation.querySelector('a:last-child');
  const update = () => {
   const inset = workLink.getBoundingClientRect().left - navigation.getBoundingClientRect().left;
   const rightInset = navigation.getBoundingClientRect().right - contactLink.getBoundingClientRect().right;
   document.documentElement.style.setProperty('--navigation-inset', `${inset}px`);
   document.documentElement.style.setProperty('--navigation-right-inset', `${rightInset}px`);
  };
  const observer = new ResizeObserver(update);
  observer.observe(navigation);
  observer.observe(workLink);
  observer.observe(contactLink);
  update();
  return { destroy() {
   observer.disconnect();
   document.documentElement.style.removeProperty('--navigation-inset');
   document.documentElement.style.removeProperty('--navigation-right-inset');
  } };
 }
</script>
<a class="skip" href="#main">Skip to content</a>
<!-- Studio uses the same navigation and copyright typography as the portfolio. -->
<header id="top" class="portfolio">
 <a class="brand" href="/">Jenna Slikkerveer</a>
 {#if $page.url.pathname !== '/studio/preview' && ($page.url.pathname === '/studio' || $page.url.pathname.startsWith('/studio/'))}
  <nav aria-label="Studio navigation">
   {#if $page.data.user}
    <!-- Keep sign-out a protected POST while presenting it as navigation text. -->
    <form class="studio-signout-form" method="POST" action="/studio?/logout">
     <button class="studio-signout" type="submit">Sign out</button>
    </form>
   {/if}
  </nav>
 {:else}
  <nav use:alignSidebar aria-label="Main navigation">
   <a href="/work" aria-current={$page.url.pathname.startsWith('/work') ? 'page' : undefined}>Work</a>
   <a href={`mailto:${site.email}`}>Contact</a>
  </nav>
 {/if}
</header>
<div class="page-content"><slot/></div>
<footer class="portfolio"><div class="footer-main">{#if ($page.url.pathname === '/studio/preview' || $page.url.pathname.startsWith('/work')) && ($page.url.pathname !== '/work' || $workHasMultipleRows)}<a href="#top" onclick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top</a>{/if}</div><small>© 2026 Jenna Slikkerveer</small></footer>

<style>
 .studio-signout-form{
  display:flex;
  align-items:center;
  justify-content:center;
  margin-top:0;
  margin-right:0;
  margin-bottom:0;
  margin-left:0;
 }
 .studio-signout{
  background-color:transparent;
  border-top-width:0;
  border-right-width:0;
  border-bottom-width:0;
  border-left-width:0;
  padding-top:0;
  padding-right:0;
  padding-bottom:0;
  padding-left:0;
  min-height:44px;
  font-family:inherit;
  font-size:inherit;
  font-weight:inherit;
  line-height:inherit;
  letter-spacing:inherit;
  text-transform:inherit;
  color:inherit;
  box-shadow:none;
 }
</style>
