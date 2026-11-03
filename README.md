# Jenna Slikkerveer — portfolio

A working design portfolio built with **SvelteKit 2, Svelte 5, JavaScript and CSS**, with project data stored in **PostgreSQL on Neon**. This is Jenna's individual Programming & Methods project, ACE2627, Berghs. The teacher approved a portfolio instead of a blog; projects fulfil the post/listing requirement.

The public site stays focused on design work. Authentication, publishing, database comments and font metadata lookups live on the unlinked `/studio` page.

## Assignment and verification

- [Original assignment brief](documents/individual-blog-project.pdf), copied from the supplied PDF without editing it.
- [Current requirement map](COURSE-PLAN.md).
- [Test results and remaining blockers](VALIDATION.md). A feature is only marked tested when its test actually ran.
- [Plain-language feature guide](documents/FEATURE-GUIDE.md).
- [GitHub and Canvas submission checklist](documents/SUBMISSION-CHECKLIST.md).
- [2-minute demo, 6-minute teaching, 2-minute Q&A outline](documents/PRESENTATION-OUTLINE.md).

The brief requires a public repository with meaningful commit history, a README and presentation slides. Canvas receives the repository link and slide deck. It does **not explicitly require a hosted website**. Completing the features alone does not guarantee a grade: the student must explain and demonstrate them.

## What is built

| Feature | Location / behaviour |
| --- | --- |
| Project listing and detail pages | `/work` → `/work/[slug]`; links return to Work. Existing projects, media paths and ordering are preserved. |
| Responsive portfolio | Home, Work and project pages adapt to desktop, tablet and phone widths. |
| Category filter | Work filters the loaded project list in the browser; no database write or external call. |
| Username/password sign-in and sign-out | Unlinked `/studio`; no public registration. |
| Protected project publishing | A signed-in studio form validates input, makes a unique slug and saves a project in Neon. New projects use artwork placeholders. |
| Database comments | Studio selects a project, adds comments, lists newest first and allows signed-in deletion. |
| External API | Font of the Day automatically calls the protected Fontsource metadata action for supported selections, validates the response and uses the returned family name. Public metadata is cached for 24 hours; no Font Details control or detail rows are shown. |
| AI summaries | In Studio, click Generate AI Summary below description/context, review or edit the draft, then save. Only that button calls OpenRouter; Save project stores the final text in Neon and displays it in Studio and the project sidebar. A working private key is required for generation. |
| SQL persistence | `projects`, `comments`, `users`, `sessions` and `login_attempts` tables in Neon. |

See VALIDATION.md for the distinction between implemented code, mocked tests, live tests and items still awaiting verification.

## Project builder — Stage A

The Add Project form now contains a manual section editor and private full-page preview. Choose among 12 section types and 9 existing editorial presentation patterns; edit headings, descriptions and additional text, reorder/remove sections, and preview at actual 1440px desktop or 390px mobile viewport widths. The preview includes entered project metadata, body text, summary, navigation, footer and details sidebar.

**This foundation is preview-only.** Section layouts live in browser memory and are cleared by refresh or leaving Studio. No layout is written to Neon yet. Media blocks are placeholders until Stage C. AI layout generation is Stage B; draft saving, editing, publication and unpublication are Stage D. The original simple project-publishing and AI-summary workflows remain available when no section layout is active. Active layouts are blocked from that legacy publish action so sections cannot silently be dropped.

The public project route and `/studio/preview` both use `src/lib/components/project/ProjectPage.svelte`, with reusable new-layout sections in `ProjectSections.svelte`. Existing custom projects keep their original rendering branches. The private preview requires authentication, has no draft data in its URL or server HTML, receives validated data only from its same-origin parent window, and uses the same public CSS in its own iframe viewport. Only this authenticated preview route permits same-origin framing; the main Studio retains frame denial.

The existing Neon `content` JSONB column was confirmed by a read-only schema check; no schema migration or record changes were needed for Stage A. Future media selection will be restricted to approved existing public paths. A private draft page does not make files in `static/` private. Permanent private uploads need a separate storage decision and must never be sent to AI automatically.

See [builder stages and verification](documents/PROJECT-BUILDER.md). Unit checks: `node --test scripts/project-sections.test.js`.

## Intentionally left out

- No public sign-up, public comments, password reset, account-management screen or media-upload service.
- No separate Contact page: the navigation opens an email draft.
- No rich-text/HTML editor: project body and comments are rendered as escaped plain text.
- No automatic AI generation on saving, bulk processing or retry. Explicit regeneration is available before publishing. A failed AI call keeps the entered fields and previous draft.
- No search or theme switcher: the category filter satisfies the JavaScript alternative.
- No weather widget: Fontsource metadata lookups satisfy the external-API feature requirement.
- Unreleased work stays a generic placeholder and is excluded from seeds and publishing.
- No deployment has been performed as part of this verification. `adapter-auto` remains configured.

## Requirements

- Node.js **22.12 or later** and npm; check with `node --version`.
- A Neon PostgreSQL database and internet access.
- An OpenRouter account/key and an available model for the real AI feature. The portfolio and project creation still work without AI configuration, but that does not verify the PD AI requirement.
- Your own licensed PP Editorial New files for the exact local typography. The repository does not distribute them.

## Run locally

1. Clone/download this repository and open its root folder, containing `package.json`.
2. Install the locked dependencies:

   ```bash
   npm ci
   ```

3. Copy `.env.example` to a new local `.env` file. **Do not overwrite an existing private file.** Replace the placeholders privately:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler/DB?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   OPENROUTER_API_KEY="your-openrouter-key"
   OPENROUTER_MODEL="google/gemini-2.5-flash-lite"
   ```

   `DATABASE_URL` is the pooled application connection. `DATABASE_URL_UNPOOLED` is the direct connection for schema setup. The model ID is configuration, not a secret; confirm it is available to your OpenRouter account. Never prefix these keys with `PUBLIC_`, paste them into chat or commit a populated environment file.

   Existing installations can also use ignored `.env.local`. Command-line helpers support both files; existing shell values take priority. Avoid defining the same key differently in both files. The legacy `db:setup` npm command specifically loads `.env.local`, so use the explicit `.env` command below for a fresh `.env` setup.

4. On a **new database**, review and run the authoritative `db/schema.sql` in Neon's SQL Editor, then seed the initial projects:

   ```bash
   node --env-file=.env scripts/setup-database.js
   ```

   Alternatively, the seed command applies the checked-in schema itself. It uses a transaction and `ON CONFLICT DO NOTHING` for existing project slugs. It does not overwrite existing projects, but running it is still a database write. Do not run the obsolete `database/schema.sql` draft. An existing complete database does not need reseeding. `npm run db:auth` is only needed to bring an older database up to the checked-in authentication migration.

5. Create the administrator in your own terminal:

   ```bash
   npm run create-user -- YOUR_USERNAME
   ```

   Enter and confirm the password at the hidden prompt. Use 3–40 letters/digits/underscores/hyphens for the username. Passwords need at least 12 characters and at most 72 UTF-8 bytes. Only a bcrypt hash is stored. The script will not replace an existing user. The alternate `npm run create-user -- USERNAME PASSWORD` form works, but can expose the password in shell history/process arguments; prefer the hidden prompt.

6. Start the site:

   ```bash
   npm run dev
   ```

   Open the printed **localhost** address. Type `/studio` manually. Secure cookies work on localhost and HTTPS; do not use a plain-HTTP LAN IP for sign-in. Keep the terminal running. Restart after changing private configuration.

7. In studio: sign in, enter a project description/context, click Generate AI Summary, review/edit the draft, save the project, add a comment, show a Fontsource-backed daily face, then sign out. Publishing a project makes it visible on Work immediately.

## Checks and repeatable tests

```bash
npm run check
npm run build
node --test scripts/font-details.test.js scripts/openrouter.test.js scripts/font-discovery.test.js
npm run preview -- --host 127.0.0.1 --port 4173
```

Keep the preview running. In a second terminal, the following shell commands target that preview:

```bash
AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-studio-origin.js
AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-auth.js
COMMENTS_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-comments.js
SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-summary-workflow.js
```

These integration tests use the configured **real Neon database** and require permission to create temporary records. They clean up only their generated fixtures; authentication also updates the normal login counters. Prefer an isolated test branch and avoid running tests while editing content. They are not read-only commands. The comments/summary scripts need an existing administrator. Summary tests mock AI and incur no model charges. Font-details unit tests use mocked public API responses and require no database or paid requests.

`PROJECT_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-add-project.js` verifies publishing and unique slugs. It does not submit the generation action; saving alone never calls OpenRouter. The summary workflow test mocks draft generation and checks that edited text survives a real Neon save and page reload. A real AI test remains separate and requires explicit approval. Each click of Generate AI Summary, including regeneration, can incur a provider charge.

For an explicitly approved, automated **one-request live AI test**, restart the preview after configuring the key and run:

```bash
LIVE_SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-live-summary.js --live
```

This explicitly generates one draft, saves it as a temporary project through the authenticated action, checks the saved summary and rendering, then removes only its temporary project/session. It can spend provider credits and never retries automatically. Do not run it merely to check whether a key exists.

Also inspect `/work` filters, mobile project-details controls, keyboard focus, media playback, Font details and 404 behaviour. Test 390px, 768px, 1000px, 1001px, 1440px and 1920px widths. Passing automated tests does not replace rehearsing the actual demonstration.

## Architecture in plain language

- Route folders become URLs. `+page.svelte` renders the interface; `+page.server.js` reads data or handles form submissions on the server.
- `src/routes/+layout.svelte` provides the shared navigation/footer.
- `src/lib/server/db.js` reads private environment variables and creates the Neon query client. It is never imported into browser code.
- `src/lib/server/projects.js` supplies project records to Home, Work and project pages. `src/lib/projects.js` and `src/lib/media.js` are initial seed snapshots, not the live content source.
- `src/hooks.server.js` validates studio sessions and request origins. `event.locals.user` holds the authenticated user for that request.
- `src/routes/studio/+page.server.js` checks authorization in every protected action before parsing/saving content or calling an API. The login action is necessarily available to guests.
- Forms use SvelteKit POST actions. A successful save redirects to a GET page, so refreshing does not submit the form or generate another summary.
- Neon stores text, structured project metadata and media URL paths. Images, videos and audio remain static files served by the website.

### Security choices and practical limits

Passwords use bcrypt (cost 12). Sessions use random 256-bit tokens in HttpOnly, Secure, SameSite=Lax cookies; only a SHA-256 hash of each token is stored in the database. Sessions expire after 12 hours and logout invalidates the stored token. Login attempts are limited using database-backed counters.

Every studio POST must have a matching Origin. Protected actions also check the user on the server. The signed-out studio does not load project/comment tools. Studio responses use no-store/noindex headers and the page includes noindex/nofollow metadata. No public page links to studio. A hidden URL is not the security mechanism: server authorization is.

Tagged-template SQL passes user values separately from SQL commands, preventing SQL injection. User content is escaped by Svelte instead of rendered with raw HTML. API requests have fixed HTTPS destinations, timeouts and response validation. Database/service errors return friendly messages without connection details. This is a tested course implementation, not an independent production security certification. There is no separate per-user quota for repeated publishing/AI requests; keep the only account private and limit the provider key's spend.

The root `src/app.html` currently also marks the entire portfolio noindex/nofollow. This is existing behaviour; only remove the global restriction deliberately when the portfolio is ready to be discoverable. Studio must remain noindex regardless.

## Optional hosting after submission checks

Hosting is not a stated Canvas deliverable in the supplied brief. Do not spend the submission window deploying unless your teacher separately requires it.

The planned target is Vercel using the **complete local project**. Before that deployment:

1. Configure `@sveltejs/adapter-vercel` in `svelte.config.js`; this has not been done yet. Follow the [official SvelteKit Vercel adapter documentation](https://svelte.dev/docs/kit/adapter-vercel).
2. Set production database and OpenRouter secrets in Vercel's environment settings, not by uploading `.env`.
3. Jenna must manually move `static/projects/usa-valentines/` and generated copies such as `.svelte-kit/output/client/projects/usa-valentines/` into an independent private backup outside the project, then rebuild. Never rely on gitignore to protect a file served from `static/`.
4. Review `.vercelignore` and the CLI's actual upload selection. Keep required public media and licensed local fonts where their licence permits; exclude secrets, private artwork and editable originals.
5. Obtain approval before CLI upload/deployment (including preview uploads). Only then use the local Vercel CLI workflow, e.g. `vercel` for a preview and, after approval, `vercel --prod` for production. Verify the deployed application and its environment afterward.

A GitHub-only build will not contain the excluded PP Editorial New fonts. Do not change the typography to compensate; supply licensed webfonts through the approved local workflow. Database contents are not included in a Git clone, so reviewers need their own Neon setup or an explicitly arranged demonstration.

## Studio creative workspace

For signed-in users, the existing Add Project and Comments forms stay in the main column. A thin divider separates a sticky right tools sidebar on desktop; at 1000px and below the tools stack underneath. The sidebar can scroll independently in short desktop windows.

- **Fontsource external API:** Selecting a Fontsource-backed typeface automatically requests current metadata through the authenticated Studio action. The server uses a fixed allowlisted endpoint, validates the response and caches it for 24 hours per server instance. Results stay local to the font component so project drafts are preserved. Independent Velvetyne faces retain official publisher links instead of an unsupported Fontsource lookup. This replaces the former Color API tool at Jenna’s request.
- **Font & Quote of the Day:** `src/lib/components/FontQuoteTool.svelte` displays a daily editorial specimen. `src/lib/studio/font-catalogue.js` is a verified metadata snapshot for 12 open-source fonts; nine were checked through Fontsource's public API and three through official Velvetyne repositories. League of Moveable Type designs are included. Credits, official sources, pinned font-file URLs and OFL licence links are recorded per font.
- `src/lib/studio/font-discovery.js` chooses a font and original line from the Europe/Stockholm calendar date. The same date gives the same pairing after refresh. Fonts rotate over 12 days and original lines over 13 days; exact daily pairs repeat after 156 days. The component checks for a new date every 30 seconds and when the tab regains focus/visibility. Discover Another explores a different pairing using the standard filled button. It leaves the official daily choice unchanged; refresh or a new day restores the daily selection. Extra descriptive metadata remains removed at Jenna’s request.
- **No additional key, paid service, OpenRouter call or database write is needed.** The curated catalogue is cached in source; Selecting a supported font additionally requests current Fontsource data through the server. The browser loads only the selected, licensed WOFF2 face from pinned jsDelivr URLs, caching loaded faces in memory. Only the quote uses it; the interface remains Futura PT and PP Editorial New. A failed font load is clearly labelled as a fallback, with the official specimen link still available. No proprietary fonts are loaded or copied into the repository.
- All 13 short lines were written for this feature; their origin is documented in source and the font-source notes. They are not attributed to historical people or represented as previously published quotations.

See [font sources and licences](documents/FONT-DISCOVERY-SOURCES.md). The catalogue is deliberately curated, not an automatic scraper or an unfiltered directory. Fontsource's [public metadata API](https://fontsource.org/docs/api/font-id) can supply font identity, variants and file URLs; designer credits and licences were cross-checked against publisher sources.


## Removing course features later

Do not delete all of `src/lib/server/`: public portfolio loaders still use `db.js` and `projects.js`.

To keep the database-backed portfolio and remove only course tools:

- Remove `src/routes/studio/` and `src/hooks.server.js` (or just its studio-specific handling).
- Remove `src/lib/server/auth.js`, `passwords.js`, `create-project.js`, `project-input.js`, `comments.js`, `font-details.js`, `openrouter.js`, `project-summary.js`.
- Remove `src/lib/components/FontQuoteTool.svelte`, `src/lib/studio/`, `src/lib/project-form.js`, account/setup-auth scripts and the feature-specific test scripts. Keep `scripts/setup-database.js` and any environment helper still used by remaining scripts.
- Remove the studio-only imports and course settings in shared files, the `test:auth`, `create-user` and `db:auth` npm commands, and `bcryptjs` if no longer used.
- Remove OpenRouter environment settings and, if desired, the explicitly labelled AI sidebar display. Stored summaries can remain as project data.
- Tables for users, sessions, login attempts and comments can remain unused. Do not drop tables or delete stored content without a separate decision and backup.

For a completely database-free portfolio, first replace all three public `+page.server.js` loaders with a maintained local project source and verify every URL/media path. Only after that can `db.js`, `projects.js` and the database dependency be removed.

## References and ownership

Implementation references: [SvelteKit form actions](https://svelte.dev/docs/kit/form-actions), [Neon with SvelteKit](https://neon.com/docs/guides/sveltekit), [Fontsource API](https://fontsource.org/docs/api/font-id), [OpenRouter API](https://openrouter.ai/docs/api/reference/overview). The supplied assignment PDF is assessment reference material, not portfolio content.

All images and design work **© 2026 Jenna Slikkerveer**. Exported portfolio images and videos may be included in the repository. Licensed fonts and editable originals are not included; original design work and media may not be reused without permission. Keep an independent local backup of excluded originals and licensed files.
