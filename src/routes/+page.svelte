<script>import Media from '#lib/components/Media.svelte';let { data } = $props();let activeProject=$state('');</script>
<svelte:head><title>Jenna Slikkerveer — Designer & AI Creative</title><meta name="description" content="Stockholm-based designer exploring visual communication, AI and new technology."/></svelte:head>
<div class="split home-layout"><main id="main" class="home-main fade"><div class="page-title"><p>Designer · AI Creative</p><h1>Jenna Slikkerveer</h1></div><div class="home-intro"><img class="portrait" src="/images/jenna.webp" alt="Jenna standing beside a lake in warm evening light" fetchpriority="high"/><section><h2>Hi! I’m Jenna.</h2><p>I’m a Stockholm-based designer with a background in visual communication design, currently studying AI Content Engineering at Berghs School of Communication. I’m exploring AI and new technology as creative media, bringing together my design experience and technical background.</p><p>I’m interested in using AI tools with intention: when to use them, when to leave them aside, and how they can expand creativity without losing human connection.</p></section></div></main><aside class="home-sidebar"><section><div class="home-sidebar-content"><h2 class="label">Selected work</h2>{#each data.selectedProjects as project}{@const n = project.home.order}<a class="mini-project" class:imperfect-thumbnail={project.slug === 'project-03'} href={`/work/${project.slug}`} aria-label={n === 2 ? "View ImPerfect" : n === 1 ? "View Fruity Pigs" : "Selected project"} onmouseenter={() => activeProject=n === 1 ? 'fruity-pigs' : ''} onmouseleave={() => activeProject=''} onfocus={() => activeProject=n === 1 ? 'fruity-pigs' : ''} onblur={() => activeProject=''}><Media src={project.home.cover} hoverSrc={project.home.hoverCover || ''} hoverVideoSrc={project.home.hoverVideo || ''} autoplay={n === 1} active={n === 2 || (n === 1 && activeProject==='fruity-pigs')} label={n === 1 ? 'Fruity Pigs selected work' : n === 2 ? 'ImPerfect brand identity' : 'Selected project'} ratio="4 / 3"/></a>{/each}<a class="mini-project" href="/work/daybreak-distillery" aria-label="View Daybreak Distillery"><Media src="/projects/daybreak-distillery/cover.png" hoverVideoSrc="/projects/daybreak-distillery/hover-preview.mp4" autoplay active label="Daybreak Distillery animated preview" ratio="4 / 3"/></a><a class="button" href="/work">View all work</a></div></section><section><div class="home-sidebar-content"><h2 class="label">Services</h2><p>AI Creative<br/>Graphic Design<br/>Motion Graphics<br/>Illustration<br/>Creative Direction</p></div></section></aside></div>


<style>
 /* Enlarge only ImPerfect's artwork; its clipped frame and hairline stay unchanged. */
 .imperfect-thumbnail :global(.media > img){
  transform:scale(1.05);
  transform-origin:center;
 }

 /* Keep each service together; the explicit breaks still separate the services. */
 .home-sidebar p{
  white-space:nowrap;
 }

 /* Title typography inherits the shared .page-title rules used by project pages. */
 /* Keep the portrait outline dark even when the mobile panel uses lighter dividers. */
 .portrait{
  border-top-width:var(--hairline);
  border-right-width:var(--hairline);
  border-bottom-width:var(--hairline);
  border-left-width:var(--hairline);
  border-top-color:#1c1c1c;
  border-right-color:#1c1c1c;
  border-bottom-color:#1c1c1c;
  border-left-color:#1c1c1c;
 }

 /* Match the thumbnail hairline without changing the button's dimensions. */
 .home-sidebar .button{
  border-top-color:transparent;
  border-right-color:transparent;
  border-bottom-color:transparent;
  border-left-color:transparent;
  box-shadow:inset 0 0 0 0.5px #1c1c1c;
 }

 /* Draw a fractional hairline without browsers rounding a border up to 1px. */
 .mini-project :global(.media){
  position:relative;
  border-top-width:0;
  border-right-width:0;
  border-bottom-width:0;
  border-left-width:0;
 }
 .mini-project :global(.media)::after{
  content:'';
  position:absolute;
  top:0;
  right:0;
  bottom:0;
  left:0;
  box-shadow:inset 0 0 0 0.5px #1c1c1c;
  pointer-events:none;
  z-index:2;
 }

 /* Hide this divider while retaining its space so Services stays in position. */
 .home-layout .home-sidebar section+section{
  border-top-color:transparent;
 }

 /* The wireframe is 1920 × 1080. Rem measurements scale with desktop width,
    while the page remains free to grow if content or the viewport changes. */
 @media(min-width:1001px){
  :global(:root:has(.home-layout)){
   font-size:calc(100vw / 1920);
   --sidebar:15.78125%;
  }
  :global(body:has(.home-layout) header){height:85rem;}
  :global(body:has(.home-layout) header .brand){padding-top:10rem;}
  :global(body:has(.home-layout) header nav){padding-top:6rem;}

  .home-main{min-height:909rem;}
  .home-main .page-title{
   padding-top:70rem;
   padding-right:24rem;
   padding-bottom:0;
   padding-left:24rem;
  }

  /* The smaller portrait and wider copy form one centered editorial composition. */
  .home-main .home-intro{
   width:1095rem;
   max-width:85%;
   grid-template-columns:minmax(0,469fr) minmax(0,574fr);
   column-gap:52rem;
   row-gap:0;
   margin-top:72rem;
   margin-right:auto;
   margin-bottom:99rem;
   margin-left:auto;
   flex-grow:0;
   flex-shrink:0;
   flex-basis:auto;
   align-items:center;
  }
  .home-intro .portrait{
   width:100%;
   height:auto;
   min-height:0;
   aspect-ratio:469 / 527;
   align-self:center;
   object-fit:cover;
   /* The PDF crops slightly below the source image's top edge. */
   object-position:center 9.2%;
  }
  /* Keep the portrait centered against the whole introduction as text reflows. */
  .home-intro section{align-self:center;padding-top:0;}
  .home-intro h2{font-size:45rem;line-height:54rem;font-weight:400;margin-bottom:17rem;}
  .home-intro p{font-size:24rem;line-height:28.8rem;margin-bottom:28.8rem;}
  .home-intro p:last-child{margin-bottom:0;}

  /* Sidebar measurements come from the reference, independent of navigation text. */
  .home-layout .home-sidebar section{
   display:block;
   flex-grow:0;
   flex-shrink:0;
   flex-basis:auto;
   padding-top:50rem;
   padding-right:57rem;
   padding-bottom:40rem;
   padding-left:57rem;
  }
  .home-sidebar-content{display:flow-root;width:100%;}
  .home-sidebar .label{font-size:20rem;line-height:25rem;}
  .home-sidebar .mini-project{
   display:block;
   width:100%;
   margin-top:25rem;
   margin-right:0;
   margin-bottom:25rem;
   margin-left:0;
  }
  .home-sidebar .label+.mini-project{margin-top:21rem;}
  .home-sidebar .button{
   width:165rem;
   min-height:49rem;
   font-size:16rem;
   margin-top:28rem;
   margin-right:auto;
   margin-bottom:0;
   margin-left:auto;
  }
  .home-layout .home-sidebar section+section{
   padding-top:18rem;
   padding-bottom:40rem;
  }
  .home-sidebar p{font-size:20rem;line-height:27rem;}
 }

 /* Give readable text more room near the desktop breakpoint, tapering back to
    the original width at 1440px so the copy stays within the portrait's height. */
 @media(min-width:1001px) and (max-width:1439px){
  .home-main .home-intro{
   width:calc(1095rem + (1440px - 100vw) / 3);
  }
 }

 /* Keep the desktop composition until tablet width. A minimum sidebar width
    protects the button padding and unbroken service names while the copy scales. */
 @media(min-width:1001px) and (max-width:1439px){
  :global(:root:has(.home-layout)){
   --sidebar:max(220px,15.78125%);
  }
  .home-main .home-intro{max-width:92%;}
  .home-layout .home-main .home-intro h2{
   font-size:clamp(28px,2.34375vw,33.75px);
   line-height:1.2;
  }
  .home-layout .home-main .home-intro p{
   font-size:clamp(15px,1.25vw,18px);
   line-height:1.3;
  }
  .home-layout .home-sidebar section{
   padding-right:clamp(20px,2.96875vw,42.75px);
   padding-left:clamp(20px,2.96875vw,42.75px);
  }
  :global(body) .home-layout .home-sidebar .button{
   width:100%;
   min-width:0;
   padding-top:0.75em;
   padding-right:1em;
   padding-bottom:0.75em;
   padding-left:1em;
  }
 }

 @media(min-width:1440px){
  /* Keep the desktop button centered at its original width inside equal gutters. */
  .home-layout .home-sidebar .button{width:165rem;}
 }

 /* Keep the existing stacked layout and three-preview grid on smaller screens. */
 @media(max-width:1000px){
  /* Prevent a stacked tablet portrait from growing larger than the desktop photo. */
  .home-layout .portrait{
   max-width:469px;
   aspect-ratio:469 / 527;
   object-position:center 9.2%;
  }
  .home-sidebar-content{display:contents;}
  .home-sidebar .label{grid-column-start:1;grid-column-end:-1;}
 }

 /* Mobile follows its own wireframe, with one uninterrupted gradient panel. */
 @media(max-width:700px){
  /* Inherit the shared mobile header so navigation matches every other page. */
  .home-layout{
   --line:#b7b7b7;
   background-image:linear-gradient(to bottom,#fff 55%,var(--pink) 100%);
  }
  .home-main{background-image:none;}
  .home-main .page-title{
   padding-top:40px;
   padding-right:4%;
   padding-bottom:24px;
   padding-left:4%;
  }

  /* A shared content width aligns the photo, introduction and preview row. */
  .home-layout .home-intro{width:78%;row-gap:28px;}
  .home-layout .portrait{
   width:100%;
   max-width:none;
   aspect-ratio:1 / 1;
   object-fit:cover;
   object-position:center 28%;
  }
  .home-layout .home-intro section{padding-bottom:0;}
  .home-layout .home-intro h2{
   font-size:clamp(26px,6.6vw,32px);
   line-height:1.2;
   margin-bottom:16px;
  }
  .home-layout .home-intro p{
   font-size:calc(15px + 1pt);
   line-height:1.3;
   margin-bottom:20px;
  }
  .home-layout .home-intro p:last-child{margin-bottom:0;}

  .home-layout .home-sidebar{
   background-color:transparent;
   border-top-width:0;
  }
  .home-layout .home-sidebar section:first-child{
   width:78%;
   padding-top:44px;
   padding-right:0;
   padding-bottom:48px;
   padding-left:0;
   column-gap:3.7%;
   row-gap:16px;
  }
  .home-sidebar .label{
   display:block;
   font-size:15px;
   line-height:1.25;
  }
  /* Services is absent from the mobile wireframe. */
  .home-layout .home-sidebar section+section{display:none;}
  .home-layout .home-sidebar .mini-project{
   margin-top:0;
   margin-right:0;
   margin-bottom:0;
   margin-left:0;
  }
  .mini-project :global(.media){background-color:#fff;}
  .home-layout .home-sidebar .button{
   grid-column-start:1;
   grid-column-end:2;
   justify-self:start;
   width:100%;
   min-height:34px;
   padding-top:0.75em;
   padding-right:1em;
   padding-bottom:0.75em;
   padding-left:1em;
   font-size:calc(10px + 1pt);
   line-height:1.2;
  }
 }
</style>
