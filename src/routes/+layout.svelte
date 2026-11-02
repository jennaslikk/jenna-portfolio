<script>
 import '../app.css';
 import { page } from '$app/stores';
 import { site } from '#lib/site';
</script>
<a class="skip" href="#main">Skip to content</a>
<header id="top"><a class="brand" href="/">Jenna Slikkerveer</a><nav aria-label="Main navigation"><a href="/work" aria-current={$page.url.pathname.startsWith('/work')?'page':undefined}>Work</a><a href={`mailto:${site.email}`}>Contact</a></nav></header>
<div class="page-content"><slot/></div>
<footer><div class="footer-main">{#if $page.url.pathname.startsWith('/work')}<a href="#top" onclick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top</a>{/if}</div><small>© 2026 Jenna Slikkerveer</small></footer>
