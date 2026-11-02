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


## Stage 1: Neon database (current setup)

The portfolio now reads project records from Neon PostgreSQL on the SvelteKit server.
Home selections, gallery order, categories, project details and media paths are stored
in `projects`. The actual media and fonts remain in their existing static folders.
The empty gallery slot and homepage preview are intentionally preserved.

- `neon.ts` declares the Neon configuration. PostgreSQL is the only service used;
  authentication is disabled here because course sign-in is a later stage.
- `.neon` is the ignored local link to the selected project and branch.
- `neon deploy` applies Neon configuration and pulls variables into ignored
  `.env.local` (or `.env` if it exists). It does not publish the portfolio to Vercel.
- `src/lib/server/db.js` reads `DATABASE_URL` privately for page queries.
- `src/lib/server/projects.js` uses parameterised queries to prevent SQL injection.
- `+page.server.js` loaders on Home, Work and the project route supply the existing UI.
- `src/lib/projects.js` and `src/lib/media.js` remain initial seed snapshots only.
  Editing those snapshots no longer changes live project records.

### Reproduce the database setup

1. Sign in with `neon login`, link the intended project and branch, and pull env.
2. Keep `DATABASE_URL` and `DATABASE_URL_UNPOOLED` only in your ignored env file.
   The pooled URL serves pages; the direct URL runs schema setup.
3. Inspect `db/schema.sql`, the current authoritative schema. The older
   `database/schema.sql` is an obsolete draft and must not be used for Stage 1.
4. Run `npm run db:setup` when env is in `.env.local`. If using `.env`, run
   `node --env-file=.env scripts/setup-database.js` instead.
5. The setup runs in a transaction and inserts the five original project records.
   Repeating it leaves existing records untouched; it does not migrate changes to
   existing table definitions.
6. Run `npm run check`, `npm run build`, then `npm run preview`.

Check Home, `/work`, all five linked project pages, the empty placeholder and a
nonexistent project URL (404). Check mobile filters, project details and media
playback in your browser. Database failures produce a friendly 503 response.

Tables for `users`, `sessions` and `comments` are prepared but have no UI yet.
There is no studio page, sign-in, comment form or AI summary generation in Stage 1.
When removing future course features, retain database/project helpers unless you
also replace the public loaders: the portfolio itself now depends on them.

### Unreleased assets and deployment

Berry Lovely remains excluded from GitHub and is not referenced or seeded.
`.vercelignore` excludes `static/projects/usa-valentines/` and matching private
asset names, alongside secrets and editable originals. Leave its local files in
place. Before any public deployment, inspect the actual deployment contents;
other upload tools may not respect `.vercelignore`. A local preview can still
serve static files by direct URL. No public deployment has been performed.

Licensed PP Editorial New fonts remain excluded from GitHub. Futura PT continues
through Adobe Fonts. The local CLI deployment will need the permitted font files.
The older starter notes above are historical; this section describes Stage 1.


## Stage 2: private studio sign-in (current)

Type `/studio` into the browser address bar. There are no links to it on public
pages and no public sign-up. A logged-out visitor sees only the sign-in form.
A signed-in visitor sees their username and a Sign out button. Project publishing,
comments and API tools are later stages and have not been added.

### Create your administrator account locally

The existing ignored `.env.local` or `.env` must contain `DATABASE_URL` and
`DATABASE_URL_UNPOOLED`. No new API keys or managed Neon Auth setup are required.
The authentication tables already exist from Stage 1. The additional database
login-throttling table is defined in `db/migrations/002-auth.sql` and included in
`db/schema.sql`. Run `npm run db:auth` on another database before using the studio.

1. In your own interactive terminal, run `npm run create-user -- YOUR_USERNAME`,
   replacing `YOUR_USERNAME` with your chosen username (3–40 letters, digits,
   underscores or hyphens). Usernames are stored in lowercase.
2. Enter a unique password at the hidden prompt, then enter it again to confirm.
   It must have at least 12 characters and at most 72 UTF-8 bytes. Long Unicode
   passwords can reach the byte limit sooner than ASCII passwords.
3. The script stores only a salted bcrypt hash (cost 12), never the password.
   It will not overwrite an existing username. There is no password reset UI yet.
4. Run `npm run dev`, use the printed **localhost** address and type `/studio`.
   Secure cookies are always enabled: use localhost for browser development and
   HTTPS on deployment, rather than an HTTP address on your local network.

For the required command-line interface, `npm run create-user -- USERNAME PASSWORD`
is also supported. Prefer the hidden prompt: passing a password as an argument can
leave it in shell history and briefly expose it in the process list. Never paste
real credentials into chat or source files.

### Security and session behaviour

- `src/hooks.server.js` validates the studio cookie on the server and sets
  `event.locals.user`. Authentication errors fail closed; public pages do not
  acquire a new authentication dependency.
- `src/lib/server/auth.js` creates a fresh random 256-bit session token after login.
  Its SHA-256 hash is stored as the session id in Neon; the usable token stays in
  an HttpOnly, Secure, SameSite=Lax cookie. Sessions expire after 12 hours.
- Every protected studio load/action checks the server identity. Login is the
  deliberately unauthenticated action. Logout requires a valid identity and POST.
- Logout deletes the database session and clears the cookie. Reusing the old
  token does not restore access. Expired and invented tokens are rejected.
- Studio mutations require the same Origin as the app. SvelteKit's built-in CSRF
  protection also remains enabled. Do not disable these checks on deployment.
- The database limits login attempts to 10 per client address and 20 per username
  in a fixed 15-minute window. Repeated wrong passwords get a friendly error;
  unknown usernames get the same error. Limits also count successful logins.
- No password, bcrypt hash or session token is returned as page data. Responses
  are marked private/no-store and noindex/nofollow. The address being unlinked
  does not replace these server checks.
- Queries use tagged parameters so entered usernames are data, not SQL commands.

### Test Stage 2

Run `npm run check` and `npm run build`. For browser testing run `npm run dev`:

1. Open `/studio` in a private browser window: only the sign-in form should appear.
2. Try a wrong password and then a nonexistent username: both should show the
   same generic error and no private content.
3. Sign in correctly: you should see “Signed in as …” and Sign out. Refresh the
   page to confirm the session persists. Do not share screenshots of credentials.
4. In browser developer tools, check the `studio_session` cookie for HttpOnly,
   Secure and SameSite=Lax. It should not be available through `document.cookie`.
5. Sign out, then refresh and use the Back button: protected content must not
   become usable. A fresh private window must still require sign-in.
6. Check narrow/mobile widths, keyboard navigation, visible focus, Home, Work,
   project pages, fonts and media. The public portfolio files were not redesigned.

For repeatable server-level verification, start `npm run preview -- --host
127.0.0.1 --port 4173`, then run `npm run test:auth` in another terminal. This
creates a temporary random test account, exercises failure/success, server access
checks, cookie flags, CSRF rejection, throttling, expiry and logout against Neon,
and removes its own test account afterward. It never prints the generated
credentials. It does not replace a real browser check of cookie storage or layout.

### Remove course authentication later

Remove `src/routes/studio/`, `src/hooks.server.js`, `src/lib/server/auth.js`,
`src/lib/server/passwords.js`, `scripts/create-user.js`, `scripts/setup-auth.js`,
`scripts/test-auth.js` and `scripts/load-private-env.js`. Remove the corresponding
`create-user`, `db:auth` and `test:auth` package scripts and the `bcryptjs`
dependency. Keep `src/lib/server/db.js`, `src/lib/server/projects.js` and the public
server loaders: the portfolio still needs them. Database auth tables can be left
unused; do not drop tables automatically. Future course stages may add more files.
