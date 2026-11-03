# Explaining the portfolio in plain language

## The public portfolio

Home introduces Jenna and links to selected projects. Work is the project listing. Clicking a project opens the route `/work/[slug]`, where the slug is its readable URL name. The server looks up that slug in Neon; missing slugs return a real 404. Media URL paths are stored in Neon, but the actual images and films are files in `static/`.

The category filter runs in the browser. `$state` holds the selected category, and `$derived` calculates the matching projects. A project can have several categories; `includes()` checks membership. Filtering reads data already loaded from the server and does not change the database.

## The private studio

Studio is reached by typing `/studio`; it is not linked from the portfolio. A guest sees only sign-in. Hiding a form is not enough for security, so every protected action also checks `event.locals.user` on the server. A failed check returns 401 before writing or contacting an API.

On sign-in the server checks a bcrypt hash. It then generates a random session token, sets a protected cookie, and stores the token's hash and expiry in Neon. On the next request, the hook checks that session and puts the user's identity into `locals`. On sign-out the stored session and browser cookie are removed. We never store a plain-text password.

## Saving a project

1. The browser sends the form using POST.
2. A server action checks the signed-in user and validates the fields.
3. The server turns the title into a slug. A database uniqueness constraint handles collisions; a suffix is tried if needed.
4. A parameterised SQL insert stores the project.
5. The server attempts its AI summary once.
6. A redirect opens a confirmation page. Refreshing that GET does not insert the project again.

A parameterised query separates the command from the entered data. A quote in a description remains part of the description rather than becoming a SQL command. Svelte also escapes entered text, so a comment containing `<script>` is displayed as text rather than run as JavaScript.

## Comments and persistence

Comments refer to a project's database id. Studio retrieves comments for the selected project, ordered newest first. Refreshing asks the database for the same stored records. A database is different from a browser variable: saved records survive a page refresh or server restart. Deletion checks both comment id and project, preventing a modified form from selecting another project's comment accidentally.

## Two different API features

The Color API is a normal external data API. The server sends a validated HEX code to `/id` and `/scheme`. It receives JSON, selects safe colour names/HEX values, and shows a seed colour plus five analogous colours. It requires no API key. Network failure gives an honest retry message.

OpenRouter is the AI API. After a project is saved, the server sends only its description and context with a short instruction. The model returns a short plain-text summary. The server validates and stores it in `projects.summary`. The UI explicitly labels it AI-generated. Review it for accuracy. A missing key or failed request leaves the project intact and the summary unavailable; we do not invent a replacement.

An atomic database claim prevents the same project from requesting a summary twice. Public views and refreshes read the stored result. New project submissions are separate requests and may cost credits, so keep the account private and use a provider spending limit.

## JavaScript and Svelte concepts to explain

- An object groups named data, such as a project's title, slug and categories.
- An array holds a list, such as projects or roles.
- A function performs a reusable operation, such as validating a comment.
- A condition chooses which UI to show, such as sign-in versus studio tools.
- `async`/`await` lets code wait for a database or API response.
- `try`/`catch` handles a failure without exposing private diagnostics.
- `$props` receives data from a parent/server; `$state` tracks changing UI state; `$derived` computes values from that state.
- Most pages use Svelte 5 runes. `Media.svelte` retains older `export let` props syntax supported by Svelte 5; it is a pre-existing component, not a separate framework.
- A component is reusable UI. `Media.svelte` handles image/video placeholders; `PaletteTool.svelte` renders palette output.
- A server file runs outside the browser. It can read private keys; browser components must not.

## Honest limitations

There is no media-upload form, public registration, password reset or rich-text editor. New projects begin with an artwork placeholder. A GitHub clone does not include the live database or licensed font files. API availability and account credits can fail independently of the app. See `../VALIDATION.md` for which behaviours were actually tested.
