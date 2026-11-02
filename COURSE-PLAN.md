# Route to Pass with distinction

Source: attached Programming & Methods / ACE2627 individual project brief. Teacher permitted a portfolio per Jenna. Confirm whether any requirements change; otherwise retain ALL rubric tasks. A polished portfolio alone cannot satisfy this brief. Technical completion does not guarantee a grade: explain, modify, test and demonstrate understanding.

## Current status

| Requirement | Status in this starter | Next step |
|---|---|---|
| Listing and several posts | One sample Journal entry and working route | Write a few real short process entries |
| Add posts | Not implemented | Protected server form/action |
| Responsive layout | Implemented; visual testing still needed | Review on phone and desktop with final fonts |
| Search/filter/theme | Journal search implemented | Test title/body matching after database connection |
| External API | Not implemented | Add a small live Stockholm weather component to Contact, with loading/error state |
| Username/password sign-in/out | Not implemented | Server sessions and password hashing; enforce publish permission server-side |
| AI API | Not implemented | Generate a draft summary for an author's post; review before publishing |
| PostgreSQL on Neon | Schema draft supplied only | Connect server code; persist posts and comments |
| Comments persisted in database | Not implemented | Validated form, insert and retrieve through server |
| Public Git history / README | README supplied; no remote created | Commit each learning stage and push |
| Presentation | Outline below | Create slides and rehearse 2+6+2 minutes |

## Stages — finish and understand one before starting the next

1. Run locally, set exact fonts, insert assets, connect contact links. Learn components, CSS grid and routing. Commit.
2. Create a Neon project; run `database/schema.sql`; put connection string in your local .env. Query posts in server-only code and render Journal entries. Never import the database client into a browser component. Commit.
3. Add username/password authentication. Use a maintained auth solution or carefully reviewed server implementation. Hash passwords; store opaque sessions in secure HttpOnly cookies; validate sessions on every protected server action; do not use a frontend boolean as authorization. Add sign-out and expiry. Commit.
4. Add authenticated post publishing with length validation, server-side slug creation and duplicate handling. Render text safely (no raw unsanitized HTML). Add comments with validation, persistent retrieval, moderation/rate limits before public deployment. Test persistence after refresh and app restart. Commit.
5. Add a real external API (e.g. Stockholm forecast). Keep it a small contact detail, not a design-dominating widget. Handle timeouts and failure honestly; no fake fallback values. Commit.
6. Add AI summary generation to the author workflow. Send the chosen draft from a protected server endpoint; API key stays in environment. Author reviews/edits the output before saving. Validate response, handle missing key/timeouts/quota errors, limit length and rate. No live AI feature exists yet. Commit.
7. Test keyboard, mobile, logged-out write denial, bad inputs, empty results, missing APIs and production build. Deploy and test real services. Document limitations. Commit.

## Starting database schema

The included SQL is a design draft, not a migration that has been applied. Use Neon PostgreSQL (required by brief). Never store plaintext passwords. Decide the auth library before finalizing auth tables. If using hosted auth, adapt author_id to its identity scheme.

## Presentation: 10 minutes

2 min: show portfolio, Journal search, author sign-in/publish, persistent comment, API and AI feature.
6 min: teach one feature. Recommended: browser → SvelteKit server action → Neon → rendered post. Explain each boundary, inspect a short real code example, make a small change, describe failures and how AI helped.
2 min: questions. Be ready to explain every submitted feature.

## Next information to collect

- Exact font families/weights and web licences; Illustrator artboard size and text sizes.
- Email, LinkedIn URL, CV file if desired.
- Original film, storyboard, three illustrations and two process clips.
- Remaining project names, covers and descriptions.
- Teacher confirmation that the Journal meets portfolio-specific post/comment requirements.
