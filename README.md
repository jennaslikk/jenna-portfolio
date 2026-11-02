# Jenna's portfolio — start here

A local SvelteKit 2 / Svelte 5 starter based on your four Illustrator wireframes. This is the visual foundation, not a completed distinction submission. No accounts or paid services are required to run this version. Your supplied PP Editorial New files and Adobe Futura PT stylesheet are connected. Project media still needs to be supplied.

## First run in VS Code

1. Unzip the download. Open the **jenna-portfolio** folder (the folder containing package.json) with File → Open Folder.
2. Open Terminal → New Terminal.
3. Check `node -v`. Use a supported Node LTS version, at least 22.12.
4. Run `npm install` (or `npm ci` when using the included lockfile).
5. Run `npm run dev -- --open`.
6. Keep the terminal running. Save an edit to see it in the browser. Ctrl+C stops the server.

Do not create another SvelteKit project inside this one. Dependencies are installed per project; VS Code is the editor, Node runs the tooling, SvelteKit is this project's framework. Vercel comes later and does not need to be installed to work locally.

## First edits, in order

- The Contact navigation link opens a new email to the address in `src/lib/site.js`. Add your full LinkedIn URL there if needed.
- Read FONTS.md for the installed typography. Compare line wraps against your Illustrator artboard in the browser.
- Add your files under `static/projects/fruity-pigs/`. Set paths in `src/lib/media.js`, for example `/projects/fruity-pigs/film.mp4`.
- Add thumbnail paths, real titles and project data in `src/lib/projects.js`. Four entries are explicit placeholders and need their own case studies. Homepage preview links temporarily point to Fruity Pigs; connect each to its real project when supplied.
- Check homepage portrait crop. The attached JPG is resized to WebP with orientation applied. Original is not modified.
- Follow COURSE-PLAN.md to add the remaining assessment features in understandable stages.

## Pages

- `/` homepage, portrait and selected-work sidebar
- `/work` asymmetric five-project gallery
- `/work/fruity-pigs` film, square storyboard, three illustrations, two process clips
- Contact in the navigation opens an email draft directly.
- Journal routes have been removed at your request.

## How the code fits together

- `src/routes/+layout.svelte`: header, footer, skip link shared by all pages.
- `src/routes/+page.svelte`: homepage.
- Route folders map directly to URLs. `work/[slug]` is a dynamic project route; its load function looks up a project or returns a genuine 404.
- `src/lib/components/Media.svelte`: reusable image/video/placeholder with an explicit aspect ratio.
- `src/app.css`: typography, grid, line weight, colours, responsive breakpoints. Variables at the top are the shared design controls.
- `static/`: files served directly. `static/images/jenna.webp` becomes `/images/jenna.webp` in the browser.

## Design fidelity and behaviour

Desktop proportions follow the provided wireframes: about 84.25% main content / 15.75% sidebar, thin rules, sharp corners, serif titles, geometric sans body, pale pink bottom fade and lilac buttons. The work gallery keeps the staggered wide/narrow cards. Video is 9:16, storyboard square, thumbnail 4:3, work landscape 16:9. Sizes scale across screen widths; compare at the same viewport size, not Illustrator's zoom percentage.

Sidebar outer column spans the full project. Its inner details use `position: sticky; top:calc(var(--header) + 24px)`, stopping before the full-width footer. On short screens the details can scroll internally; on mobile they become a normal section below the project. Footer is never fixed. Header stays at the top on desktop. Overscroll is disabled. Footer remains at the end of the document and reaches the viewport bottom on short pages.

Exact text sizes in Illustrator and original artboard dimensions would allow closer tuning. Border tone is deliberately centralized rather than emulating inconsistent export antialiasing.

## Checks

Run `npm run check` and `npm run build`. Then `npm run preview` to inspect the production build. Also test:
- 390px, 768px, 1440px and 2048px widths, without horizontal overflow.
- Keyboard-only navigation and visible focus; skip link reaches main content.
- A long project scroll: sidebar sticks; footer is not overlapped.
- Work cards, 404 route, contact links after configuration, navigation without selected-page underlines.
- Video controls with real videos; provide caption tracks for speech and a transcript when appropriate.
- Reduced-motion preference. This starter does not autoplay videos.

## Before public release

Supply project assets; replace placeholder projects and sample Journal copy; enable real contact links; check image descriptions and video captions; complete the course extensions; verify deployed API error states; do not publish secrets. This version has no live database, authentication, comment submission, external data API or AI calls. Those are deliberately the next learning stages rather than simulated features.

## Git

From this folder: `git init`, `git add .`, `git commit -m "Build portfolio layout from wireframes"`. Create an empty public repository in your account and follow its commands to add the remote and push. Commit each real feature as you implement it. Do not fabricate past commits. Explain AI assistance in your presentation. The gitignore excludes .env, dependencies and build output; review assets for publication rights before pushing.

## Deployment later

This project uses adapter-auto. After local checks pass, connect your repository to Vercel using its dashboard and follow its current SvelteKit instructions. Configure secrets in the hosting environment, never in client JavaScript. There is no need to install a Vercel desktop app. Hosting is not yet set up in this starter.

## Copyright & assets

- The source code in this repository is shared for course assessment (Programming & Methods, Berghs) and may be viewed for that purpose.
- All images, design work and visual content shown on the website are © 2026 Jenna Slikkerveer, all rights reserved. They may not be copied, reused or distributed without written permission.
- Image files (`static/images/`) and licensed fonts (`static/fonts/`, PP Editorial New) are intentionally not included in this repository. Running the project locally will show placeholder boxes and fallback fonts (Georgia and Jost) instead.
