# Plan: Onboard `GM2.2-Runner` User Documentation (`2026-11-23`)

## Goal

Register and sync `https://github.com/vibdocs/GM2.2-Runner.git` (`GM Mailer 2.2 Runner`, slug `gm2-2-runner`, `docsType: "users"`) into `docs.vib.tools` via `config/projects.json`, verify full build/SEO/Pagefind/link integrity, and visually verify the rendered Hub card and product docs routes in headless Chromium.

## Inspected Files

- `config/projects.json`
- `config/site.config.json`
- `scripts/add-project.mjs`
- Upstream `https://github.com/vibdocs/GM2.2-Runner.git` (`.vibtools/docs.config.json`, `.vibtools/logo.png`, `docs/`)

## Implementation Steps

1. **Register repository in `config/projects.json`:**
   - Run `npm run add-project -- --url https://github.com/vibdocs/GM2.2-Runner.git` so `config/projects.json` appends the bare Git URL (`.vibtools/` auto-discovery mode).
2. **Sync, test, build, and verify:**
   - Run `npm test && STRICT_SYNC=1 npm run verify` to sync `calgrid`, `readbox`, and `gm2-2-runner`, generate `src/generated/manifest.json` and `public/logos/gm2-2-runner.png`, build all static HTML/`.md`/`llms.txt`/sitemap/Pagefind outputs, and confirm zero broken links or image/SEO issues.
   - Run `compile_applet`, `lint_applet`, and `restart_dev_server`.
3. **Live Browser Verification (`playwright-cli`):**
   - Inspect `/` (`1440x900`) to confirm `3 projects`, `GM Mailer 2.2 Runner` card (`v2.2.10`, logo, `Desktop Apps`), balanced `Start here:` shortcuts, `CategoryTabs` filtering, and `SearchModal` results for `GM Mailer`.
   - Inspect `/gm2-2-runner/` to confirm docs layout, sidebar navigation, CTA link, rendered logo/images, and `0` console errors.
4. **Update durable log:**
   - Update this note and append a dated entry in `project/CHANGELOG.md`.

## Progress & Results

- Registered `https://github.com/vibdocs/GM2.2-Runner.git` into `config/projects.json` via `npm run add-project -- --url https://github.com/vibdocs/GM2.2-Runner.git`.
- Synced `.vibtools/docs.config.json`, `.vibtools/logo.png`, and `19` documentation pages (`slug: "gm2-2-runner"`, `title: "GM Mailer 2.2 Runner"`, `version: "2.2.10"`, `category: "Desktop Apps"`, `accentColor: "#4F8EF7"`, `ctaLabel: "Get Support"`, `ctaUrl: "https://support.vib.tools/"`).
- Caught and resolved a broken link (`gm2-2-runner/index.html -> /gm2-2-runner/manifest/`) caused by upstream `docs/index.md` linking to `MANIFEST.md`, which `scripts/sync-docs.mjs` intentionally strips during sync; updated `rewriteInternalMarkdownLinks` in `astro.config.mjs` to collapse stripped `manifest.md` links to their parent directory route alongside `index.md` and `readme.md` (documented in `project/04-codebase-reference.md`).
- Verified `npm test` (`31/31` pass), `npm run lint` (`tsc --noEmit`), `compile_applet`, `STRICT_SYNC=1 npm run verify` (`67` HTML files, `16` required assets, `3` projects, `65` Pagefind pages, `0` broken internal links), and live Playwright Chromium checks across `/` and `/gm2-2-runner/` (`3` project cards, `Desktop Apps` filter `2`, `Email & Collaboration` filter `1`, `0` broken images, `0` console errors/warnings).
