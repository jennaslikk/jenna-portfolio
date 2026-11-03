# Portfolio project builder

## Current status

| Stage | Status |
| --- | --- |
| A — Foundation | Implemented and tested: section library, manual editor and authenticated desktop/mobile preview |
| B — AI layout and visual editing | Implemented; structured output and browser interaction tested with mocked AI, not a paid live request |
| C — Existing public media | Implemented for selecting already-public project assets; no uploads or external storage |
| D — Drafts and publishing | Not implemented for section layouts; existing simple publishing remains available without sections |
| E — Final verification | Current-increment checks completed; persistence/publication verification must follow Stage D |

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

## Current visual workflow

1. Sign into `/studio`. Enter name, project type and a free-text description.
2. Click **Generate my project layout**. This is one potentially paid OpenRouter request using the configured model; the model must support structured JSON output. No request is made on saving/editing/previewing.
3. A large visual draft opens. Click a heading or paragraph and type directly, without a text dialog. The project introduction/title, sidebar details and media captions also edit in place. Use Layout options, arrows, Remove, Undo remove and Add section. Presentation choices stay inside More options.
4. Click an image/video placeholder and select an already-public portfolio asset. Captions, accessible descriptions and original proportions are retained. No uploads take place.
5. Switch Desktop/Mobile, scroll the whole page, and choose Preview finished page to hide editing controls. Return to Edit page or Studio without losing the in-memory draft.
6. Do not refresh with work you need to keep: persistence and publishing are not implemented yet. The UI clearly states this. The original working publishing/summary form is still available under More project options.

## Current implementation

- `VisualProjectCreator.svelte` presents the short brief and visual editor. Existing `ProjectBuilder.svelte` remains available inside the optional original form.
- `generateLayout` is an authenticated Studio form action. `generateProjectLayout` reuses the existing OpenRouter server transport, configured key/model, timeout and no-retry policy. It sends only title, category and description.
- `layout-response.js` defines the JSON schema and validates every response against approved sections. Missing facts become private questions/material suggestions, not invented claims. The renderer escapes all text and never executes generated code.
- The preview and public route share `ProjectPage.svelte` / `ProjectSections.svelte`. Existing published projects retain their original branches and content. Preview editing controls are conditional and absent from public pages.
- `project-media.js` builds a catalogue only from current public project records. `media-paths.js` excludes private project paths, external URLs and unsupported files. Neither helper scans or uploads private files. Both parent and authenticated frame validate selected media against this catalogue.
- Optional reference images use local browser object URLs only. They are excluded from submitted form fields. Image analysis is not implemented and would need explicit consent.

## Increment verification

- Svelte check: zero errors/warnings; production build passed.
- Thirteen unit tests passed across summary requests, approved sections, structured layout validation, request count, invalid/truncated responses and media allowlisting.
- Mocked browser tests passed for guest rejection, forged Origin rejection, invalid input, brief-only initial UI, loading state, one generation request, text editing, add/move/remove/undo, cover/image/video selection, captions and original proportions, clean preview/edit toggle, 390px frame without overflow, failed regeneration preserving work, and different branding/animation structures.
- Outer Studio checked at 390/768/1001/1440/1920px without horizontal overflow. Desktop screenshot inspected.
- All five existing published projects at 390/768/1000/1001/1440/1920px (30 samples) matched the original baseline in text, media, typography and measured geometry.
- Existing AI summary tests passed after transport reuse. No paid AI requests or database writes were made; all generated-layout responses were mocked. Full login/comment/publish database mutations were deliberately not rerun in this increment.

## Next stage: private persistence and explicit publication

Use the existing Neon content JSONB structure for layout and draft status, add authenticated save/reopen flows, exclude drafts from all public loaders, and require explicit publication approval. Never overwrite custom published projects. Test save, reload, draft privacy and publish using isolated temporary records before enabling the complete workflow. New private upload storage remains a separate discussion.

## Direct text editing

`InlineText.svelte` uses plain-text editable spans inside the actual page headings and paragraphs. Typing sends an origin/source-checked message to the Studio parent, where `updatePreviewText` allows only known text fields and validates the complete updated preview model. Updates return to the same frame without replacing unchanged text, preserving the cursor. Paste inserts plain text; no generated or pasted HTML is executed. Uppercase styling does not alter source capitalization. Roles/tools retain unfinished lines so Enter can add another item.

Direct editing is enabled only in authenticated Studio edit mode. Clean preview/public pages render ordinary text. Media selection and presentation controls retain their dialogs; fixed navigation, footer and template labels remain part of the design. Edits remain in memory until the later persistence stage.
