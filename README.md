# Jenna Slikkerveer — portfolio

A working design portfolio built with **SvelteKit 2, Svelte 5, JavaScript and CSS**, with project data stored in **PostgreSQL on Neon**. This is Jenna's individual Programming & Methods project, ACE2627, Berghs. The teacher approved a portfolio instead of a blog; projects fulfil the post/listing requirement.

The public site stays focused on design work. Authentication, publishing, database comments and the colour API live on the unlinked `/studio` page.

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
| External API | Studio calls The Color API on the server for a colour name and five-colour palette, with analogous, complementary, triadic, tetradic and monochrome scheme options. |
| AI summaries | In Studio, click Generate AI Summary below description/context, review or edit the draft, then save. Only that button calls OpenRouter; Save project stores the final text in Neon and displays it in Studio and the project sidebar. A working private key is required for generation. |
| SQL persistence | `projects`, `comments`, `users`, `sessions` and `login_attempts` tables in Neon. |

See VALIDATION.md for the distinction between implemented code, mocked tests, live tests and items still awaiting verification.

## Intentionally left out

- No public sign-up, public comments, password reset, account-management screen or media-upload service.
- No separate Contact page: the navigation opens an email draft.
- No rich-text/HTML editor: project body and comments are rendered as escaped plain text.
- No automatic AI generation on saving, bulk processing or retry. Explicit regeneration is available before publishing. A failed AI call keeps the entered fields and previous draft.
- No search or theme switcher: the category filter satisfies the JavaScript alternative.
- No weather widget: The Color API satisfies the external-API requirement.
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

7. In studio: sign in, enter a project description/context, click Generate AI Summary, review/edit the draft, save the project, add a comment, generate a palette, then sign out. Publishing a project makes it visible on Work immediately.

## Checks and repeatable tests

```bash
npm run check
npm run build
node --test scripts/color-api.test.js scripts/openrouter.test.js
npm run preview -- --host 127.0.0.1 --port 4173
```

Keep the preview running. In a second terminal, the following shell commands target that preview:

```bash
AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-studio-origin.js
AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-auth.js
COMMENTS_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-comments.js
SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-summary-workflow.js
PALETTE_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-palette.js
```

These integration tests use the configured **real Neon database** and require permission to create temporary records. They clean up only their generated fixtures; authentication also updates the normal login counters. Prefer an isolated test branch and avoid running tests while editing content. They are not read-only commands. The comments/summary/palette scripts need an existing administrator. The palette test contacts the real Color API; summary tests mock AI and incur no model charges.

`PROJECT_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-add-project.js` verifies publishing and unique slugs. It does not submit the generation action; saving alone never calls OpenRouter. The summary workflow test mocks draft generation and checks that edited text survives a real Neon save and page reload. A real AI test remains separate and requires explicit approval. Each click of Generate AI Summary, including regeneration, can incur a provider charge.

For an explicitly approved, automated **one-request live AI test**, restart the preview after configuring the key and run:

```bash
LIVE_SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-live-summary.js --live
```

This explicitly generates one draft, saves it as a temporary project through the authenticated action, checks the saved summary and rendering, then removes only its temporary project/session. It can spend provider credits and never retries automatically. Do not run it merely to check whether a key exists.

Also inspect `/work` filters, mobile project-details controls, keyboard focus, media playback, the palette copy button and 404 behaviour. Test 390px, 768px, 1000px, 1001px, 1440px and 1920px widths. Passing automated tests does not replace rehearsing the actual demonstration.

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

- **Colour palette:** reuses the existing protected Color API action and `/id` + `/scheme` helper. `src/lib/studio/palette-options.js` lists the allowed schemes, validated before any request. Palette results stay inside their component so exploring colours does not reset an unsaved project or summary draft.
- **Font pairing:** `src/lib/components/FontPairingTool.svelte` uses the curated list and rules in `src/lib/studio/font-pairings.js`. Serif headlines pair with sans-serif body text; sans-serif headlines pair with serif body text; display headlines pair with restrained sans-serif body text. Choose a headline family or explore a category, then refresh to rotate three suggestions. These are rule-based starting points, not AI output.
- **No Google API key or new environment variable is required.** The full Google Fonts Developer API is unnecessary for this small catalogue. The component loads only its preview fonts through Google's key-free CSS API; Futura PT and PP Editorial New continue to style the interface. Google font stylesheets are mounted only with the authenticated Studio tools, not on public pages. Font previews require internet access and fall back to local generic fonts offline. No OpenRouter request is made for font pairings.

Google references: [CSS API](https://developers.google.com/fonts/docs/css2), [Developer API metadata and key requirements](https://developers.google.com/fonts/docs/developer_api). The catalogue is intentionally curated rather than a live search of every Google font.

## Removing course features later

Do not delete all of `src/lib/server/`: public portfolio loaders still use `db.js` and `projects.js`.

To keep the database-backed portfolio and remove only course tools:

- Remove `src/routes/studio/` and `src/hooks.server.js` (or just its studio-specific handling).
- Remove `src/lib/server/auth.js`, `passwords.js`, `create-project.js`, `project-input.js`, `comments.js`, `color-api.js`, `openrouter.js`, `project-summary.js`.
- Remove `src/lib/components/PaletteTool.svelte`, `src/lib/components/FontPairingTool.svelte`, `src/lib/studio/`, `src/lib/project-form.js`, account/setup-auth scripts and the feature-specific test scripts. Keep `scripts/setup-database.js` and any environment helper still used by remaining scripts.
- Remove the studio-only imports and course settings in shared files, the `test:auth`, `create-user` and `db:auth` npm commands, and `bcryptjs` if no longer used.
- Remove OpenRouter environment settings and, if desired, the explicitly labelled AI sidebar display. Stored summaries can remain as project data.
- Tables for users, sessions, login attempts and comments can remain unused. Do not drop tables or delete stored content without a separate decision and backup.

For a completely database-free portfolio, first replace all three public `+page.server.js` loaders with a maintained local project source and verify every URL/media path. Only after that can `db.js`, `projects.js` and the database dependency be removed.

## References and ownership

Implementation references: [SvelteKit form actions](https://svelte.dev/docs/kit/form-actions), [Neon with SvelteKit](https://neon.com/docs/guides/sveltekit), [The Color API](https://www.thecolorapi.com/docs), [OpenRouter API](https://openrouter.ai/docs/api/reference/overview). The supplied assignment PDF is assessment reference material, not portfolio content.

All images and design work **© 2026 Jenna Slikkerveer**. Exported portfolio images and videos may be included in the repository. Licensed fonts and editable originals are not included; original design work and media may not be reused without permission. Keep an independent local backup of excluded originals and licensed files.
