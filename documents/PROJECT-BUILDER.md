# Portfolio project builder

## Current status

| Stage | Status |
| --- | --- |
| A — Foundation | Implemented and tested: section library, manual editor and authenticated desktop/mobile preview |
| B — AI layout | Not implemented; existing AI summary generation remains separate and working |
| C — Media | Not implemented; preview uses placeholders, with no uploads or new media URLs |
| D — Drafts and publishing | Not implemented for section layouts; existing simple publishing remains available without sections |
| E — Final verification | Stage A checks completed; complete-workflow verification must follow later stages |

## What Stage A changes

- `src/lib/studio/project-sections.js`: twelve allowed section types, nine presentation choices, stable section IDs, ordering and validation. Preview models contain only allowed fields and no media paths in this stage.
- `src/lib/components/ProjectBuilder.svelte`: add/edit/remove/reorder controls and the modal preview. The current section list stays in memory; refresh and page navigation clear it. No database save or AI generation occurs.
- `src/lib/components/project/ProjectSections.svelte`: reusable editorial content patterns using existing project-section, gallery, storyboard and comparison styles. Media remains an honest placeholder.
- `src/lib/components/project/ProjectPage.svelte`: extracted existing public page, preserving its custom Fruity Pigs and other branches. Both the public route and private preview render this component, so the preview is not a separate imitation.
- `src/routes/work/[slug]/+page.svelte`: thin wrapper around that shared renderer. Public data/URLs are unchanged.
- `src/routes/studio/preview/`: authenticated preview shell. Data is exchanged directly with the parent tab using origin/source-checked messages and validated again in the frame. No draft enters a URL, server HTML or database.
- `src/hooks.server.js`: only the authenticated preview response uses SAMEORIGIN framing; the rest of Studio retains DENY. Existing session and Origin checks remain.
- `src/routes/+layout.svelte`: preview uses the same public navigation/footer as real projects; ordinary Studio keeps its sign-out navigation.
- Studio form: passes the current fields to preview, disables legacy publishing while sections exist, and adds a server guard against silently losing a layout in the old save workflow.

## Testing completed

Svelte check: zero errors/warnings. Production build: passed. Four foundation unit tests cover all section defaults, reorder behaviour, validation bounds, duplicate IDs, rejection of premature private/external media paths, plain-text preservation and preview-field filtering.

Before/after browser comparison: all five existing public projects at 390, 768, 1000, 1001, 1440 and 1920px (30 samples) had identical displayed text, media URLs, typography and measured geometry after renderer extraction. A later longhand-only expansion preserved equivalent margins.

Interactive checks: add/edit/reorder/remove, preservation when returning from preview, all nine media-presentation patterns, actual 1440px and 390px iframe widths, mobile project-details expansion, entered body/summary/sidebar data, preview header/footer, safe escaped text, no horizontal overflow, guest preview denial, no public preview URL, no draft in server HTML, and server-side publication refusal for active layouts. Browser screenshots were inspected. The isolated preview mocked only a test-session lookup and blocked real database writes and paid AI calls. No project, media, schema, secret, commit or deployment was changed.

## Review Stage A in your browser

1. Sign into `/studio` and enter project details.
2. Find Build your project layout beneath the existing fields. Add Introduction, Storyboard and Creative Process.
3. Edit the text and presentation; try Move up, Move down and Remove.
4. Choose Preview Project, switch Desktop/Mobile, scroll the complete page and use the mobile Project Details control.
5. Choose Edit Project or Return to Studio. Your entered fields and section order should remain.
6. Keep this work temporary: refreshing or leaving Studio clears the section layout in Stage A. No Save Draft is available yet. Do not use real unreleased media; media selection has not been enabled.

## Later implementation boundaries

Stage B will reuse the current OpenRouter request infrastructure with a structured, server-validated layout response and mocked tests first. Stage C will select only approved existing local media; static assets are public, even if a project is a draft. No private uploads or new external storage service should be introduced without discussion. Stage D must add server-protected draft persistence and public-loader publication filtering before any section layout can be published. Existing custom project records and media must remain untouched.
