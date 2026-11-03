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
<!-- Keep the shared portfolio styling separate from the private course page. -->
<header id="top" class:portfolio={!$page.url.pathname.startsWith('/studio')}><a class="brand" href="/">Jenna Slikkerveer</a><nav use:alignSidebar aria-label="Main navigation"><a href="/work" aria-current={$page.url.pathname.startsWith('/work')?'page':undefined}>Work</a><a href={`mailto:${site.email}`}>Contact</a></nav></header>
<div class="page-content"><slot/></div>
<footer class:portfolio={!$page.url.pathname.startsWith('/studio')}><div class="footer-main">{#if $page.url.pathname.startsWith('/work') && ($page.url.pathname !== '/work' || $workHasMultipleRows)}<a href="#top" onclick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top</a>{/if}</div><small>© 2026 Jenna Slikkerveer</small></footer>
