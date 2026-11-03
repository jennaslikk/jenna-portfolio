# Final GitHub and Canvas checklist

Based on the original assignment PDF, pages 3–4. Check VALIDATION.md for the latest measured results. This is a checklist, not evidence that a remaining item has happened.

## Essential before tonight's submission

- [x] Configure OpenRouter privately: the saved key is detected and accepted by OpenRouter.
- [x] Verified a real Gemini summary through Studio after paid credits were added: Neon storage, reload rendering, unchanged original projects and temporary-record cleanup all passed. Current-key browser/Git scans passed.
- [ ] Rehearse sign-in, publishing, refreshing stored comments, category filtering, Fontsource font-details lookup, summary display and sign-out.
- [ ] Prepare/export the actual presentation slide deck. The Markdown outline is preparation material, not a finished PowerPoint/PDF deck.
- [ ] Put the finished slide deck in `documents/` so it is included in the repository.
- [ ] Review and approve the final changes, then commit them yourself or explicitly authorize the commit. Keep earlier meaningful commits.
- [ ] Push the final code, README, documentation and slides only after approval.
- [ ] Open the repository in a signed-out/private browser window and confirm the submitted branch, history and files are publicly accessible.
- [ ] In Canvas, submit the public repository link **and** the presentation deck. Open both submitted items to confirm they work.

A hosted website is not explicitly required in the supplied brief. If the teacher separately asked for a hosted URL, treat deployment as another required step with its own approval.

## Safety checks before selecting files

- [ ] Keep an independent backup of the entire local project, especially ignored fonts, editable originals and private unreleased artwork.
- [ ] Read `git status --short` and `git diff`. Do not stage everything blindly.
- [ ] Check Git's selected files with `git diff --cached --name-only` after staging is approved.
- [ ] Never include `.env`, `.env.local`, other populated environment files, keys or credential files. `.env.example` contains placeholders only.
- [ ] Do not include `static/fonts/` or other `.otf`, `.ttf`, `.woff`, `.woff2`, `.eot` files.
- [ ] Do not include editable originals such as `.ai`, `.psd`, `.psb`, `.aep` or `.aepx`.
- [ ] Keep the entire `static/projects/usa-valentines/` folder and names matching the unreleased project excluded. Do not restore that project's title, media or entry.
- [ ] Inspect available Git history for excluded files as well as the working tree. Ignore rules do not erase earlier commits. The audit result is in VALIDATION.md; recheck after later changes.
- [ ] Keep public exported media tracked where intended, including Barbie Berry Kisses (a separate project).
- [ ] Check media sizes: GitHub warns over 50 MiB and rejects ordinary files over 100 MiB. Browser uploads have a 25 MiB limit. Report oversized files; do not compress, use Git LFS, move or delete artwork automatically.
- [ ] Review screenshots and slides for passwords, database URLs, API keys, session cookies and private browser/terminal information.

The repository was publicly accessible during the audit at `https://github.com/jennaslikk/jenna-portfolio`. This does not mean uncommitted local changes have been uploaded. Recheck the final branch after an approved push.

## Final technical checks

```bash
npm run check
npm run build
node --test scripts/font-details.test.js scripts/openrouter.test.js
```

- [ ] Read the output; a build starting is not the same as a successful build.
- [ ] Restart the production preview after rebuilding; a preview process can cache references to the previous build.
- [ ] Confirm `/`, `/work`, each project and `/studio` load.
- [ ] Confirm an unknown project returns 404.
- [ ] Check 390px, 768px, 1000px, 1001px, 1440px and 1920px, especially the Studio forms and Work filters.
- [ ] Sign out and check that Studio tools disappear. Guest POST requests must fail on the server, not only have hidden forms.
- [ ] Confirm the summary is clearly labelled AI-generated and that refreshing does not resubmit or regenerate.
- [ ] Keep any intentionally incomplete items stated accurately in README and VALIDATION.md.

## Only if deploying later

- [ ] Configure the Vercel adapter and production environment settings.
- [ ] Jenna manually backs up/moves unreleased static assets and generated copies outside the project, then rebuilds.
- [ ] Review `.vercelignore` and the actual CLI upload selection. Gitignore does not make static assets inaccessible.
- [ ] Confirm licensed webfont deployment rights and supply the local files without committing them.
- [ ] Obtain approval for any preview or production upload/deployment.
