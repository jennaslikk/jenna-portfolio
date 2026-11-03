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
- Studio uses `Referrer-Policy: same-origin`. Unlike `no-referrer`, this preserves
  the browser's Origin on normal same-origin HTML form submissions while keeping
  studio URLs out of referrers sent to other sites. Refresh an already-open studio
  page after changing this header so the browser uses the new policy.
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


### Studio Origin regression check

With a local development server on port 4174, run
`node scripts/test-studio-origin.js`. To use another local port, set
`AUTH_TEST_ORIGIN` to its origin when running that command. This check creates no
accounts and uses no administrator credentials. It verifies the response policy,
same-origin form validation and rejection of missing, null and foreign Origins,
including a forged same-origin Referer. The full `test:auth` command still uses a
temporary account; do not run it when additional accounts have not been authorised.


## Stage 3: add a portfolio project

Sign in at `/studio`. Under Sign out, the Add a project form accepts title,
category, type (landscape or portrait), year, client, description, context, roles,
tools and body content. Title, category, type and description are required; other
fields are optional. Enter roles and tools one per line. Category options match
the current public filter names. Select one or more categories using the checkboxes; all selections are saved and used by the Work filters.

Saving publishes immediately on `/work`, after the existing projects. No media
upload is included: new cards and detail pages use the existing blank artwork
placeholder. Existing assets, homepage selections, gallery CSS and existing
project presentations are unchanged. Body content is plain text with preserved
line breaks; HTML is escaped, not executed. Context, roles and tools are displayed
in the new project's existing-style sidebar. No AI request is made and summary
remains null. The unreleased Berry Lovely title remains blocked.

`src/routes/studio/+page.server.js` checks authentication before reading or saving
input. `src/lib/server/project-input.js` validates lengths and allowed choices.
`src/lib/server/create-project.js` uses parameterised SQL and retries a title-based
slug with numeric suffixes when needed; the database's unique constraint also
protects concurrent submissions. New display positions are appended without
updating original records. Saving redirects to a confirmation page, so refreshing
it does not submit the project again. Validation failures preserve entered values.

### Browser test

1. Run `npm run dev` and sign in at the localhost `/studio` address.
2. Confirm the Add a project form follows Sign out and fits a narrow/mobile window.
3. Fill in an intended public project, select categories and a type, and save. Expect a
   confirmation with a View project link. Refresh the confirmation: no duplicate
   should appear. There is no edit/delete UI in this stage.
4. Open Work, confirm the new card appears after the existing projects, and try
   its category filter. Open its page and check the text, sidebar and placeholder.
5. An intentional second submission with the same title should get a different
   URL ending in a number. Do not do this with a real project unless wanted.
6. Try submitting without a required field; validation should help you correct it.
7. Sign out: the project form must disappear and protected submissions must fail.

For automated verification, start `npm run preview -- --host 127.0.0.1 --port 4176`
and run `node scripts/test-add-project.js` in another terminal. It uses a temporary
session for the existing administrator (without reading or changing the password),
creates uniquely named temporary projects, and removes only its own projects and
session afterward. It does not create another user. Checks cover server access,
validation, concurrent unique slugs, database persistence, public rendering,
escaping and preservation of every original record.

To remove course publishing later, remove the `createProject` action and its
studio form, `src/lib/server/create-project.js`, `src/lib/server/project-input.js`,
`src/lib/project-form.js` and `scripts/test-add-project.js`. Keep public loaders
and the `createdViaStudio` rendering branch if you want already-published projects
to remain readable. Deleting the publishing form does not delete database content.


## Stage 4: private project comments

The Comments section is below Add a project on `/studio`. Select an existing
project and click View comments. Enter a name (1–80 characters) and comment
(1–2,000 characters), then Save comment. Names and messages are trimmed and
validated on the server. Roles/accounts are unchanged: only signed-in studio
users can read or submit comments. No public comments UI or API has been added.

`src/lib/server/comments.js` checks the server identity and uses parameterised SQL
for project-specific reads and inserts. The existing `comments` table and its
project/date index are reused; no migration or new dependency is needed. Results
are ordered by creation time descending, then id descending for ties. Times are
shown in Stockholm time. Text is escaped by Svelte and line breaks are preserved;
HTML is never executed. Missing or deleted projects are rejected. Login/session,
Origin, no-store and CSRF protections remain in place.

Saving redirects back to the selected project, so refreshing reads persisted
comments rather than submitting another one. Choosing a different project uses a
GET form and puts the project slug in the studio URL. Failed submissions keep the
entered name/message and show friendly validation errors. Logged-out requests do
not query or receive project/comment data. Comments stay entirely inside studio;
the public portfolio loaders and templates were not changed in Stage 4.

### Test in your browser

1. Run `npm run dev`, open `/studio` and sign in.
2. Scroll below Add a project to Comments, choose a project, and click View comments.
3. Enter a name and comment and save. Add another: the newer one should be first.
4. Refresh. Both should remain and no duplicate should appear.
5. Select another project and click View comments: comments from the first must
   not appear. Switch back to see them again.
6. Check empty inputs, keyboard operation and the section on a narrow screen.
7. Sign out or open a private browser window: Comments and project options should
   be absent. Public Home, Work and project pages should have no comments section.

Automated verification: start `npm run preview -- --host 127.0.0.1 --port 4177`,
then run `node scripts/test-comments.js`. It creates a temporary session for the
existing administrator without reading or changing their password, writes two
uniquely marked test comments, verifies persistence, ordering, isolation, escaping,
validation and denied access, and removes only its own comments and session.
No additional account is created. Existing comments are compared and preserved.

To remove course comments later, remove the Comments section, the `addComment`
action, the comments portion of the studio loader, `src/lib/server/comments.js`
and `scripts/test-comments.js`. Leave database records in place unless Jenna
explicitly approves their removal. No public portfolio code depends on comments.

Each saved studio comment now names its project and has a Delete comment button.
The browser asks for confirmation; the server requires a valid session and checks
both the comment id and project before deletion. Saving/deleting redirects back
to the selected project. Public portfolio pages still have no comment controls.
The comments verification script also tests deletion, rejected unauthorized and
cross-origin deletes, and rejection of a mismatched project.


## Stage 5 verification: existing category filters

The Work page already implements category filtering from Neon category arrays,
including projects with multiple categories, an All Projects option, empty-result
text, selected-button state and a mobile filter toggle. Existing labels are
preserved: Branding corresponds to the brief's Graphic Design wording, and
Motion Graphics to Motion. No public layout or category labels were changed.
A final manual check is to select each category at desktop and phone widths.

## Stage 6: The Color API palette tool

The private studio now has a Colour palette section after Comments. Enter a
three- or six-digit HEX code, with or without `#`, and click Generate palette.
The page shows the seed colour's API-supplied name and five analogous colours,
each with a swatch, name, HEX value and Copy HEX button. Copy uses the browser
clipboard on localhost/HTTPS; if permission is denied, select the displayed HEX
and copy it manually. A status message reports success or failure.

### How the request works

1. The browser posts the HEX to the studio's `generatePalette` server action.
2. The action checks the signed-in user and validates the HEX input.
3. `src/lib/server/color-api.js` calls the fixed HTTPS `/id` endpoint for the
   seed name and `/scheme` with `mode=analogic&count=5` for the palette.
4. An eight-second timeout, HTTP checks and response validation prevent endless
   waiting or unsafe values. Errors show a friendly retry message, not a fake
   palette. Only validated HEX codes and names are returned to the page.
5. `src/lib/components/PaletteTool.svelte` renders the swatches locally. API image
   URLs are not used, and the browser never calls the external API itself.

No API key, database migration or package installation is needed. No account
information or database credentials are sent to The Color API—only the HEX code
and palette options. Login, session and CSRF protection remain in place. Public
portfolio pages are unchanged; no AI API has been implemented.

Documentation checked: https://www.thecolorapi.com/docs (`/id` and `/scheme`).

### Tests and browser checks

- `node --test scripts/color-api.test.js` tests HEX shorthand/invalid input,
  fixed endpoint construction, safe response parsing, HTTP/JSON errors and timeout.
- For live verification, start `npm run preview -- --host 127.0.0.1 --port 4178`
  and run `node scripts/test-palette.js`. It creates only a temporary session for
  the existing administrator, checks denied access and invalid input, calls the
  live API through the app and verifies all six swatches and copy controls. The
  temporary session is removed and account/content records are not changed.
- In your browser, sign in to `/studio`, scroll below Comments, enter `#DEC1DA`,
  and generate a palette. Try `abc` as shorthand, then invalid text. Click Copy
  HEX and paste into a spare text field to confirm the clipboard value. Check
  loading feedback, keyboard focus and the layout on a phone-sized screen.
- Sign out: the palette tool must disappear. No external request is made just
  by visiting a public page or the logged-out studio.

To remove the palette feature, remove its studio component/import and server
`generatePalette` action, `src/lib/components/PaletteTool.svelte`,
`src/lib/server/color-api.js`, `scripts/color-api.test.js` and
`scripts/test-palette.js`. No public portfolio code depends on it.


## Stage 7: AI-generated project summaries

New projects created through the signed-in studio workflow now attempt one short
OpenRouter summary after the project is safely stored. Only description and
context are sent to the model. Existing projects are not regenerated or changed.
The result is stored in `projects.summary`, shown in the studio's saved-project
confirmation and in the public project sidebar under Summary (AI-generated).
Review the generated text for accuracy. The AI output is displayed as escaped
plain text, never HTML.

### Secure OpenRouter setup

1. Create an account at https://openrouter.ai and create a key at
   https://openrouter.ai/settings/keys. Give it a small spending limit and add
   credits if your account requires them.
2. In VS Code, create/open the project-root `.env` privately. Keep existing Neon
   settings in `.env.local` unchanged. Add:

   ```dotenv
   OPENROUTER_API_KEY="paste-your-key-here"
   OPENROUTER_MODEL="google/gemini-2.5-flash-lite"
   ```

3. Replace only the key placeholder in your local file. Do not paste the key in
   chat, terminal commands, screenshots or source code. Never prefix it PUBLIC_.
4. Restart the local server so SvelteKit loads the private variables. `.env` and
   `.env.local` are ignored by Git and excluded from Vercel uploads. Only the
   placeholder `.env.example` belongs in the repository.

`google/gemini-2.5-flash-lite` is the default low-cost model. On 2 November 2026,
OpenRouter lists $0.10 per million input tokens and $0.40 per million output tokens;
check current pricing at https://openrouter.ai/google/gemini-2.5-flash-lite before
changing models. A response is capped at 160 tokens. No SDK/dependency or new
schema is required. The API call uses the existing server-side fetch.

### Request and cost control

- Authentication and project validation happen before saving or AI processing.
- The validated project is saved first. Slug collision retries do not call AI.
- The database atomically marks generation as started before making the request.
  A second processor cannot generate again for the same project. A successful
  result is stored using parameterised SQL.
- The request uses a fixed HTTPS endpoint, a ten-second timeout, a short output
  limit, no application retries and no provider fallback. Provider data collection
  is set to deny. The API key is only an Authorization header, never prompt text.
- Only the description and context are sent; images, passwords, user information,
  database credentials and project body are not sent.
- API errors, missing configuration or invalid output leave the original project
  saved and summary null, with an honest notice in studio. No replacement summary
  is fabricated. There is no automatic retry, regeneration button or bulk call.
- Refreshes, public project views and studio confirmation views read the saved
  summary without contacting OpenRouter. Each new project submission is a new
  project and may incur one request; do not save duplicates just to retry AI.
- Already saved projects without a summary are not automatically backfilled when
  you add a key. Test with an intended new project after configuring the key.

### Test Stage 7

Run `npm run check`, `npm run build` and `node --test scripts/openrouter.test.js`.
The unit tests mock the service and incur no API charges. They cover request
bounds, validation, response rejection, timeouts, missing keys, failed requests,
authentication and concurrent duplicate-processing prevention.

For database/rendering verification, start
`npm run preview -- --host 127.0.0.1 --port 4179`, then run
`node scripts/test-summary-workflow.js`. It uses a temporary session for the
existing administrator and temporary projects; all model responses are mocked.
It verifies Neon storage, studio/sidebar rendering, refreshes, failed-AI handling
and preservation of original projects, then removes its temporary records.
No administrator password is read and no real OpenRouter request is made.
The older `test-add-project.js` refuses to run with a real OpenRouter key to avoid
silently spending credits during its multiple creation checks.

For one real browser test, configure the key privately, restart `npm run dev`,
sign in to studio and create an intended new project with a clear description
and context. Expect a summary on the confirmation and project sidebar. Refresh:
the summary should stay the same and OpenRouter Activity should show no extra
request. Sign out to confirm the creation form remains protected. A live model
response cannot be verified until a working private key is configured.

To remove AI later, remove the summary-processing call/private env imports from
the create action, `src/lib/server/openrouter.js`,
`src/lib/server/project-summary.js` and the two summary verification scripts.
Remove the AI confirmation/sidebar sections if desired. Stored summaries can stay
in Neon; do not delete content automatically. No public page needs an API key.
