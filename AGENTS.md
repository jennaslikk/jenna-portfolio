# AGENTS.md: instructions for the AI coding assistant

## About this project
A portfolio website for Jenna Slikkerveer (designer · AI creative), built with **SvelteKit + Svelte 5 (runes)**.
It is also my individual course project for **Programming & Methods (ACE2627) at Berghs**. My teacher has approved a portfolio instead of a blog. I am aiming for **Pass with distinction (PD)**.

The finished site must work as a **real portfolio**. The course-required features that don't belong on a portfolio (sign-in, comments etc.) must live on one **hidden `/studio` page**, and be easy to **remove later**.

I am a designer, not an experienced developer. I must be able to **explain every part of this code** in my presentation. So:
- Explain what you did and why in plain language after every change.
- Add short comments in the code that explain *why*, not just *what*.
- Prefer simple, readable code over clever code. No unnecessary libraries.

---

## Course requirements (all must be met)
| # | Requirement | How we solve it in a portfolio |
|---|---|---|
| 1 | Post listing, open a post, go back | `/work` lists projects → `/work/[slug]` shows one → "View all work" goes back (**already built**) |
| 2 | Add a post (signed-in users only) | Add-project form on the hidden `/studio` page |
| 2 PD | Comments stored in the database | Comments section on `/studio` (add a comment to a chosen project, list comments per project) |
| 3 | Readable, responsive layout | **Already built**. Keep it that way, including on `/studio` |
| 4 | Search, filter OR theme switcher | Category filter on `/work` (All · Graphic Design · Motion · Illustration · AI Creative) |
| 5 | External API | **The Color API** (thecolorapi.com, free, no key) on `/studio`: enter a hex colour (or pick one) → show its official colour name and a generated palette with names and hex codes |
| 6 | Sign in / sign out with username + password | Sign-in form on `/studio`. No public sign-up |
| 7 PD | AI API | When a project is added on `/studio`, generate a short **AI summary** with **OpenRouter**, store it in the database and show it on `/studio` (and in the project sidebar as "Summary (AI-generated)") |
| 8 PD | SQL database | **PostgreSQL on Neon** (free tier) stores projects, comments, users and sessions |

---

## The hidden `/studio` page (very important)
The public site (Home, Work, project pages, Contact) must stay a **clean portfolio**. Everything course-only lives on **one hidden page: `/studio`**.
- **No links to `/studio` anywhere** on the site: not in the header, footer or anywhere else. I reach it by typing the address.
- **Hidden from search engines:** add `<meta name="robots" content="noindex, nofollow" />` to `/studio` (via `<svelte:head>`).
- **Locked:** when not signed in, `/studio` only shows a sign-in form (username + password). Nothing else is visible or loaded.
- **When signed in**, `/studio` shows (in this order, each as a clearly separated section in the existing visual style):
  1. "Signed in as …" + Sign out button
  2. Add a project (form) → saves to the database → generates the AI summary
  3. Comments: pick a project, write a comment, see existing comments per project (newest first)
  4. Colour palette tool (The Color API)
- **Protect it on the server:** every form action on `/studio` must check that the user is signed in (not just hide the forms in the HTML).
- Keep the course-only code in its own places so it's easy to delete later:
  - `src/routes/studio/`
  - `src/lib/server/` (database, auth and AI helpers, server-only)
- Add a section to `README.md` explaining `/studio` and listing which files to delete to remove the course features later.

---

## Technical rules (always follow)
- **Secrets stay on the server.** Read keys only via `$env/static/private` (or `$env/dynamic/private`), and only inside server files (`+page.server.js`, `+layout.server.js`, `+server.js`, `hooks.server.js`, `src/lib/server/*`). Never in `.svelte` files or files that run in the browser.
- **Never write real secrets into any file except `.env`.** Keep `.env.example` up to date with placeholder values:
  ```
  DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
  OPENROUTER_API_KEY="your-openrouter-key"
  OPENROUTER_MODEL="a-cheap-model-id-from-openrouter"
  ```
- **SQL:** use `@neondatabase/serverless`. Always use parameterised queries (tagged template literals), never string concatenation. That prevents SQL injection, so mention it in your explanation. Put the table definitions in `db/schema.sql` so I can run them in Neon's SQL Editor.
- **Passwords:** hash with `bcryptjs` (never store plain text). **Sessions:** random session id stored in a `sessions` table + an `httpOnly`, `secure`, `sameSite=lax` cookie. Set `event.locals.user` in `src/hooks.server.js`. No public sign-up: create my user with a small script (`npm run create-user -- <username> <password>`).
- **Protect `/studio` on the server** (in `+page.server.js` load and every form action), not just by hiding things in the HTML. Not signed in → only the sign-in form is shown and actions return an error.
- **Forms:** use SvelteKit form actions (`<form method="POST">`) with server-side validation and friendly error messages.
- **External/AI requests** happen server-side. Handle failures gracefully (try/catch, fallback, timeout).
- **The Color API:** check its documentation (thecolorapi.com) for the `/id` and `/scheme` endpoints before writing code. Call it from the server (`+page.server.js` form action), validate the hex input, and show a friendly message if the request fails.
- **Imports:** this project uses `#lib/...` (not `$lib/...`). Keep it consistent.
- **Svelte 5 runes** (`$props`, `$state`, `$derived`). No old `export let` syntax.
- **CSS: always write properties in longhand.** `padding-top`, `padding-right`, `padding-bottom`, `padding-left`, `margin-top`…, `border-top-width`, `border-top-style`, `border-top-color`, `background-color`, `background-image`, `grid-column-start`/`grid-column-end`, `row-gap`/`column-gap`. **Never** shorthand like `padding: 10px 20px`, `margin: 0 auto`, `border: 1px solid`, `background: …`, `gap: …`, `font: …`, `inset: …`. (Shorthand is confusing to me.)
- **Don't change the existing design** (layout, fonts, colours, wireframe structure) unless I ask. New UI must match the current style: `app.css` variables, `.label`, `.button`, thin grey lines.
- **Files that must never be committed** (check `.gitignore` contains them): `.env`, `.env.*` (except `.env.example`), `node_modules`, `.svelte-kit`, `static/fonts/` (licensed fonts), `static/images/` (my artwork).

---

## Git and working style
- **Never run `git commit`, `git push` or any destructive command** (`rm -rf`, `git reset --hard`, dropping tables) without asking me first.
- Work **one stage at a time** (below). After each stage, **stop** and give me:
  1. a plain-language summary of what changed and why,
  2. how to test it in the browser,
  3. a suggested commit message.
  Then wait for me to test and commit before starting the next stage.
- If something is unclear, ask me instead of guessing.

## Stages (in this order)
1. **Database:** `db/schema.sql` (projects, comments, users, sessions), seed the projects currently in `src/lib/projects.js`, load all pages from Neon instead of the file. Add `summary` (text, nullable) and `category` columns to projects. Keep image placeholders.
2. **Sign in / sign out:** the hidden `/studio` page with sign-in form and sign-out, `hooks.server.js`, sessions, `create-user` script.
3. **Add project:** form on `/studio` (title, category, type, year, client, description, context, roles, tools, body). Auto-generate the slug from the title. New projects appear on `/work`.
4. **Comments:** comments section on `/studio`, stored in Neon. Choose project + name + message, validated, newest first.
5. **Filter:** category buttons on `/work`. It must still work on small screens.
6. **External API:** colour palette tool on `/studio` (The Color API).
7. **AI summary:** OpenRouter call when a project is added, stored in `projects.summary`, shown on `/studio` and in the project sidebar.
8. **Finish:** switch to `@sveltejs/adapter-vercel`, add a `.vercelignore` containing `.env` and `.env.*` (plus `!.env.example`), and write `README.md` (what's built, what was intentionally left out, how to run it, how to set up Neon/OpenRouter with placeholders, how to remove course features, copyright note: all images and design work © 2026 Jenna Slikkerveer, fonts and images not included in the repo).
