# Submission verification — 3 November 2026

This is an evidence record, not a grade guarantee. The original rubric is in [documents/individual-blog-project.pdf](documents/individual-blog-project.pdf). The teacher-approved portfolio maps projects to posts. Earlier starter claims that authentication, comments and APIs were absent have been replaced by the results below.

## Priority status

**Stage 7 verification now passes.** After Jenna added paid OpenRouter credits, one real `google/gemini-2.5-flash-lite` summary was generated through the authenticated Studio publishing action, saved to Neon, and displayed in Studio and the public project sidebar across repeat page requests. The helper compared original project rows unchanged and removed its own temporary project/session. The current key's exact-value scan passed for the browser build, tracked files, Git index and available Git history. Earlier failures below are retained as diagnostic history, not the current result.

**A finished slide deck must still be included and submitted.** `documents/PRESENTATION-OUTLINE.md` is a rehearsal outline, not the final deck. The public GitHub repository is accessible, but these local documentation changes have not been committed or pushed.

## Requirement-by-requirement audit

| Requirement | Current verification | Evidence / remaining action |
| --- | --- | --- |
| List projects, open individual pages, return | Tested | Public routes returned 200 in authentication/publishing tests; new saved entries appeared on Work and their detail routes. The browser checked every public project at six widths and an unknown slug returned 404. |
| Add a project while signed in | Tested against real Neon | Actual SvelteKit create actions accepted valid inputs, generated unique slugs even for concurrent submissions, stored fields and rendered the new public pages. Guests/cross-origin requests and invalid fields were rejected. Temporary projects were removed. |
| Username/password login and logout | Tested against real Neon | Temporary account: correct/wrong/unknown credentials, Secure/HttpOnly/SameSite cookie flags, hashed session token storage, reload persistence, logout/replay denial, token rotation, expiry and login throttling passed. Administrator password was never read or changed. |
| PostgreSQL on Neon | Tested live | Read-only query returned PostgreSQL 18.6. Real project/comment/session writes and retrieval passed. Five original projects and one administrator were present before verification; original records were preserved. Account billing/free-tier selection was not independently changed or verified. |
| Persistent project comments (PD) | Tested against real Neon | Validation, newest-first ordering, refresh persistence, project separation, HTML escaping, protected deletion and preservation of pre-existing comments passed. Temporary comments/session were removed. |
| Work category filtering | Tested in the browser | Every category's rendered slugs matched the database categories at all six widths; the mobile filter toggle opened correctly. |
| External Color API | Tested live through Studio | Protected server action called real `/id` and `/scheme`, rendered the seed plus five named HEX swatches and copy controls. Invalid input, guest/cross-origin denial and safe failure handling passed. |
| OpenRouter summary pipeline (PD) | PASS — real generation and persistence tested | Mocked success was stored in Neon and rendered in Studio/public sidebar. Repeat processing/refresh did not call the mocked model again. Failure preserved the original saved project. After paid credits were added, the real Gemini test passed generation, Neon storage, Studio/public rendering and repeated page requests. Its temporary records were removed. |
| Responsive layout | Tested in local Chromium | Public pages plus signed-out and signed-in Studio passed at 390, 768, 1000, 1001, 1440 and 1920px without horizontal overflow. The small Studio tablet footer overflow was corrected. Real-device/cross-browser testing remains a manual limitation. |
| Basic security | Tested, with limits below | Logged-out actions, strict Origin checks, forged/expired cookies, login throttling, parameterised input, HTML escaping and no-secret browser responses were tested. This is not an independent production security certification. |

## Tests actually run

- `npm run check`: passed, 0 errors and 0 warnings.
- `npm run build`: passed using the existing adapter-auto. It warns that no deployment target was detected; this is not a failed local build or a verified deployment.
- `npm ls --depth=0`: installed dependencies resolve without missing-package errors.
- `node --test scripts/color-api.test.js scripts/openrouter.test.js`: **12 passed, 0 failed**. These are mocked/no-charge tests, including HTTP errors, validation, malformed output, timeout and duplicate-processing prevention.
- `AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-studio-origin.js`: passed actual HTTP guest access and Origin checks.
- `AUTH_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-auth.js`: passed actual login/logout/session tests using a temporary generated account.
- `COMMENTS_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-comments.js`: passed real Neon storage, rendering and protected deletion tests.
- `PROJECT_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-add-project.js`: passed authenticated publishing, validation, unique slugs, escaping and refresh behaviour. This ran while no real OpenRouter key was configured. The script refuses to run with a real key to avoid multiple paid calls.
- `SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-summary-workflow.js`: passed real Neon persistence/rendering with **mocked AI responses**.
- `PALETTE_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-palette.js`: passed a **real Color API request through the authenticated application action**.
- `node --check scripts/test-live-summary.js`: syntax checked. A syntax check is not a live AI test. Its refusal to run without `--live` was also tested without requests or writes. The helper requires `--live`, a real private key and a local preview, submits once and cleans up only its own records.
- `LIVE_SUMMARY_TEST_ORIGIN=http://127.0.0.1:4173 node scripts/test-live-summary.js --live`: **failed** at the generated-status assertion after one authenticated publishing POST. No retry. Targeted temporary project/session cleanup completed.
- Final browser verification: **passed**. All seven public routes, guest Studio, all category filters and the audio/footer spacing passed at all six widths. Signed-in Studio tools also passed at all six widths. The actual browser accepted the Secure loopback session cookie and sign-out returned to the sign-in form. An unknown project returned 404. Scroll motion was disabled only for geometric measurements; production animation code was not changed.

Integration tests targeted a locally running production preview, with explicit permission to create/remove only test fixtures in the configured Neon database. Existing project records were compared before and after. These commands are not read-only and should not be run casually against a live portfolio while editing it. The real AI test is separately gated because it may spend credits.

## Security, Git and media checks

- No forbidden secret, font, editable-original or unreleased-asset paths were found among tracked files in the audit's checks.
- An all-object path scan of all 10 available local commits found no excluded secret/font/original/private-asset paths. This is a current check, not permission to stage future files blindly.
- Public exported media scan found no files over 50 MiB. Files were not compressed, moved or modified.
- Browser build scan found **0 matches** for the configured database connection strings/private key among 29 JavaScript/JSON/HTML/CSS/map files. Media files were excluded from the text scan. A targeted scan is not a guarantee that every possible secret in every historical object is absent.
- GitHub returned HTTP 200 and `private: false` for `https://github.com/jennaslikk/jenna-portfolio`. Final local changes remain uncommitted/unpushed.
- `.gitignore` excludes environment files, credentials, licensed fonts, originals and unreleased assets while permitting public media. `.vercelignore` separately excludes private upload material and allows locally supplied licensed webfonts.
- Local unreleased static assets and generated build copies remain in place. Jenna must move them to an independent private backup and rebuild before any deployment, as AGENTS.md requires. No upload or deployment was performed.

## What is incomplete, intentionally limited or not tested

1. Real OpenRouter generation, Neon persistence and repeated page rendering now pass. Future provider outages, credit exhaustion and rate limits can still cause graceful summary failures.
2. The finished slide deck and final approved commit/push/Canvas submission remain human submission steps. The brief does not explicitly require hosting.
3. Vercel deployment is not configured/tested; adapter-auto is still installed. Production HTTPS behaviour and provider hosting limits were not verified by a local preview.
4. Browser testing uses local Chromium at emulated viewport sizes; it is not a physical iPhone/Safari or cross-browser certification. Clipboard permission behaviour needs a manual check on Jenna's presentation browser.
5. Existing generic project/artwork placeholders are intentional. New project creation has no media-upload UI. Existing images/videos/URLs must not be changed for the assignment.
6. Public site-wide noindex remains in `src/app.html`. Studio noindex is deliberate; changing public discoverability is a later portfolio decision.
7. The current auth model has one manually created account and no public sign-up/reset. AI uses one request per newly submitted project, not a per-account publishing quota; provider spending limits and keeping credentials private matter.
8. `Media.svelte` still uses Svelte's supported legacy `export let` prop syntax and existing CSS contains shorthands. These pre-existing convention/cleanup items were not refactored during the deadline audit; they are not missing rubric features, but differ from AGENTS.md preferences.
9. Fresh-account Neon provisioning and a fresh-clone licensed-font setup were documented, not performed on a new paid/free account during this audit. Do not overwrite the existing database with the obsolete schema draft.

## Small fixes and preparation in this audit

- Copied the supplied assignment PDF into `documents/` without modifying the original.
- Replaced outdated README/course-plan material with the actual implementation, safe setup and original rubric mapping.
- Added the feature explanation, GitHub/Canvas checklist and 2–6–2 presentation outline.
- Added the explicit one-request live-summary verification helper.
- Matched Fruity Pigs' audio-to-footer gap to the gap before Sound generation: 64px on mobile, 100px on tablet, 100 artboard-rem on desktop.
- Fixed the Studio tablet footer's 1px overflow by using the same minimum column width as navigation. Forms and portfolio design were not redesigned.

No commit, push, deployment, credential change or existing media change was made.

## Earlier Stage 7 verification attempts (historical failures)

| Requested check | Result | Evidence |
| --- | --- | --- |
| Real OpenRouter summary returned | FAIL | All three separately approved live generation attempts through fresh previews failed, including the retry after OpenRouter account verification; no usable summary was returned. The key is now configured and accepted by OpenRouter. |
| Real generated summary saved to Neon | FAIL | Current database has zero non-null summaries. Earlier mocked persistence passed, but does not establish real AI success. |
| Real saved summary survives reload | FAIL — unverified | There is no real saved summary to reload. Mocked reload/rendering was tested separately. |
| No OpenRouter key exposed in checked browser/Git locations | PASS | Exact configured-key and token-pattern scans found zero matches in 29 browser build text files, tracked working-tree files, Git index and 178 available Git blobs. Root `.env` is ignored. This covers available local history, not inaccessible remote objects. |
| Temporary fixture cleanup | PASS | Current counts: five projects, one user, zero comments, zero summaries. Zero matching temporary projects/accounts/comments. The live helper removed its own temporary project/session. Earlier integration assertions confirmed preservation of original project records; this failed live run did not reach its final full-row comparison. |

Read-only OpenRouter diagnostics: key metadata HTTP 200; credits metadata HTTP 200 with no positive paid balance; configured `openrouter/free` appears in the model catalogue. These checks establish key acceptance and configuration, not a successful generation or a confirmed explanation for its failure. No privacy settings were weakened and no key was overwritten.

Stage 7 remains incomplete until a real generation succeeds, is stored and survives reload. All three approved generation attempts have been used; do not retry without renewed approval. No portfolio design, commit, push or deployment changes were made in this recheck.

Latest retry: Jenna explicitly approved another attempt after finishing OpenRouter verification. The live helper again reached the saved project but found `summaryStatus: failed`. It removed its own temporary project/session. No design, key, or application-code changes were needed or made for this retry.

Updated-key retry: Jenna approved a third generation attempt after updating the local key. A fresh preview loaded it; the single live helper attempt again found `summaryStatus: failed` and removed its temporary project/session. No usable real summary was saved. Earlier exact-key scans apply to the previously configured key; this retry did not repeat the full history scan against the replacement key.

Gemini configuration follow-up: the saved `OPENROUTER_MODEL` is now `google/gemini-2.5-flash-lite`. One live Studio summary test with a fresh preview still returned the application status `failed`; its temporary project/session were removed. A separate read-only credits request returned HTTP 200 and no positive paid balance. This is a likely blocker for the paid model, but this attempt’s exact generation HTTP error was not retained by the application. No additional generation request was sent. Stage 7 remains incomplete.

## Final Stage 7 result after paid credits were added

| Check | Result | Evidence |
| --- | --- | --- |
| Real AI summary returned | PASS | One real Gemini request through Studio completed successfully. |
| Summary saved to Neon | PASS | The helper read the generated status and actual summary directly from PostgreSQL. |
| Summary persists after reload | PASS | Studio and two successive public project GET requests displayed the stored summary. |
| Current key absent from checked browser/Git files | PASS | Zero exact-key or token-pattern matches in 29 browser text files, tracked files, index and 178 available Git blobs; `.env` ignored. |
| Temporary records removed; original content preserved | PASS | The helper compared all original project rows unchanged and removed its temporary project/session. Read-only follow-up: five projects, one user, zero comments; zero matching temporary projects/accounts/comments. |

The generated test summary was deliberately deleted with its temporary project after successful persistence checks. No real portfolio entry was changed. No design, key, commit, push or deployment changes were made. Stage 7 is complete for the tested local implementation; Stage 8 has not been started.


## Explicit AI draft workflow update

At Jenna's request, Studio now generates only when Generate AI Summary is clicked. The draft is editable and can be regenerated before publishing. Save project stores the final submitted text in the existing summary column and never calls OpenRouter. The schema and public layout were unchanged. Previous real-provider success above applies to the same OpenRouter helper; this updated interaction was tested without paid calls.

Verified: 11 mocked unit tests passed; Svelte checks passed with zero errors/warnings; production build passed. The updated integration script verified authentication, invalid input, origin protection, explicit mocked drafts, edited-summary Neon persistence, optional empty summaries, reload rendering and original-record preservation. Browser tests exercised the real Studio actions with a local mock intercepting OpenRouter: loading, draft generation before other required fields are complete, regeneration, failed regeneration preserving edits, final edited-text save and no overflow at 390/768/1001/1920px. Temporary projects/sessions were removed. No real OpenRouter requests, portfolio design changes, commits, pushes or deployments were made for this update.


## Studio creative-sidebar update

Added the authenticated-only sticky tools sidebar, stacked below main content at 1000px and narrower. The existing palette integration now accepts a validated documented scheme mode; its enhanced form keeps results local to protect unsaved project drafts. Font pairings use a curated catalogue and explicit category-contrast rules, with Google Fonts CSS used only inside previews. No Developer API key or new environment setting is needed.

Verification: 15 mocked unit tests passed (including allowed palette modes, pairing rules and existing AI helper checks); Svelte check passed with zero errors/warnings; build passed. An isolated browser preview blocked all SQL writes and paid AI calls, mocked only a test-session lookup, and allowed real read-only portfolio data. It verified layout/no overflow at 390/768/1000/1001/1280/1440/1920px, desktop sticky positioning, guest/action denial, three font pairs, category/family selection, refresh, font links, real Google font loading, interface-font isolation, one real complementary palette, six swatches, clipboard copy, invalid HEX, a mocked colour API outage, and unsaved project draft retention. Public Home/Work/Fruity Pigs pages remained tool-free and loaded successfully; Add Project validation retained entered summary text. Existing authentication code and permissions were unchanged. No real database records were created or modified, and no paid AI request, commit, push or deployment was made.


## Font & Quote of the Day replacement

Replaced Font Pairing only: Studio now mounts FontQuoteTool in the same sticky sidebar position below the existing palette. The 12-font catalogue contains verified Fontsource/League/Velvetyne designs, all OFL-1.1; each has publisher credit, a licence link and a pinned webfont URL. No proprietary fonts are loaded. Metadata is a local snapshot; selected fonts load on demand, with a clear unavailable/fallback state. Quotes are newly written original Studio text without invented author attributions.

Verified with unit tests: Stockholm winter/summer midnight and DST transitions; stable daily selection; no font repeats within 12 days; independent 13-line rotation; Discover/Return behaviour; catalogue source/licence invariants. Browser tests loaded all 12 real fonts and confirmed their FontFace entries were loaded and applied to the quote, quote changes, full-refresh stability, Return to Today, simulated Stockholm midnight without reload, no specimen or page horizontal overflow at 390/768/1001/1440/1920px, and explicit fallback when font delivery was blocked. Desktop/mobile screenshots were visually inspected. No runtime Fontsource metadata or AI request was made by the tool. Public/guest pages did not render it. Existing palette, Add Project and Comments forms remained present. The isolated preview mocked only a test-session lookup and blocked real database writes and paid AI requests. No Neon records, public layout, project/AI/comment functionality or authentication code was changed in this replacement.


## Project builder Stage A

Implemented the manual section library/editor and private desktop/mobile preview only. The existing public project page was extracted into a shared renderer; all 30 before/after project/viewport samples matched in text, media paths, typography and measured geometry. The private frame is authenticated, origin/source checked, non-cacheable and contains no draft in server HTML or URL. Its viewport uses the actual shared portfolio renderer, navigation/footer and responsive CSS. Active section layouts cannot be silently published by the old form action. Stage A has no layout persistence, real media selection or AI layout generation; these remain later stages. Refresh/navigation clears the section draft and the UI says so.

Four foundation unit tests and browser checks passed, including all 12 section types/9 layout choices, edit/reorder/remove, actual desktop/mobile viewports, full body and sidebar text, escaped input, returning to edit, layout publication guard, guest/public isolation and no horizontal overflow. Svelte check and build passed. Read-only Neon inspection confirmed five projects and the existing JSONB content column, with no saved layout records. Browser verification used a mocked test-session lookup while blocking actual database writes and paid AI calls. No existing records, local media, secrets, commits, pushes or deployments were changed. See documents/PROJECT-BUILDER.md for remaining stages.


## External API replacement: Fontsource

At Jenna’s request, removed the Color API component, action, helper, options and retired tests. Studio’s sidebar contains only Font & Quote of the Day. Its new authenticated Font details action requests current Fontsource metadata for allowlisted Fontsource-backed entries, validates the returned identity/licence/weights/styles/subsets/version, caches public results for 24 hours and displays those facts. It needs no key or paid service. Independent foundry entries keep official source links. Static daily selection alone was not counted as a live external API integration.

Verification: three mocked unit tests passed for the fixed endpoint, response validation, cache hit/expiry, invalid IDs and provider errors. The real Fontsource request succeeded through the protected Studio form action and displayed current metadata. Browser checks passed at 390/768/1001/1440/1920px with no horizontal overflow and confirmed project/summary draft retention, a helpful mocked-provider-failure state, guest denial, Origin protection and invalid-input handling. Public Home/Work/Fruity Pigs loaded without tool controls. The isolated preview blocked actual database writes and paid AI calls, mocking only a test-session lookup. No real database records, portfolio design, AI integration, secret, commit, push or deployment was changed. Course map, README and demo outline now describe Fontsource rather than the retired colour tool.


Latest font-tool simplification: removed the visible Font Details control and metadata rows at Jenna’s request. The protected metadata form is now hidden and triggered once per supported selected font; the returned family name supplies the visible font label. The server’s 24-hour cache and validation remain. Browser verification with mocked API responses confirmed no visible detail control/rows, one lookup for each of the nine supported fonts over a full discovery cycle with no repeat request on returning to the starting font, and retention of typed project/summary text. Svelte checks, build and seven font tests passed; no paid requests or database writes were made.
