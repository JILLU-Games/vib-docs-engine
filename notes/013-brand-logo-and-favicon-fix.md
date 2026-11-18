# Brand Logo & Favicon Visibility Fix (2026-11-18)

## Goal

Ensure the authentic Vib Tools brand mark, product logo, favicons, and PWA manifest icons render reliably across the Hub header/footer, `ProjectCard`, Docs `Topbar`, and browser `<head>` tags — and cannot disappear during gitignored `public/logos/*` cleanups.

## Inspected Files

- `public/` (`favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `site.webmanifest`, `logos/.gitkeep`)
- `config/site.config.json`, `config/presets/user-portal/site.config.json`, `config/presets/dev-portal/site.config.json`
- `src/layouts/BaseLayout.astro`, `src/layouts/HubLayout.astro`, `src/components/hub/ProjectCard.astro`, `src/components/docs/Topbar.astro`
- `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, `.gitignore`

## Root Causes Found

1. `public/logos/vib-tools.png` was absent from `public/logos/` (because `public/logos/*` is `.gitignore`-excluded as a generated directory), causing `http://localhost:3000/logos/vib-tools.png` to return `404` and `HubLayout.astro` (`existsSync`) to fall back to `<BookOpen />` in both header and footer.
2. `docs/` had no `logo.png` file, so `scripts/sync-docs.mjs` (`findLogo`) produced `"logoUrl": null` for `vib-docs-engine` and rendered `"VD"` monograms on `ProjectCard` and `Topbar`.
3. `public/site.webmanifest` tagged icons only as `"purpose": "maskable"` (missing `"any"`), and `BaseLayout.astro` lacked explicit `shortcut icon` / `192x192` PNG icon links.

## Implementation Steps

1. Copy the verified `180x180` Vib Tools icon mark (`public/apple-touch-icon.png`) to tracked `public/vib-tools-logo.png`, `public/logos/vib-tools.png`, and `docs/logo.png`.
2. Update `config/site.config.json` and both presets (`user-portal`, `dev-portal`) to `"brandLogo": "/vib-tools-logo.png"` so the portal logo lives outside the generated `public/logos/` directory.
3. Update `src/layouts/BaseLayout.astro` icon `<link>` tags and `public/site.webmanifest` icon purposes (`"any"` and `"maskable"`).
4. Extend `scripts/verify-build.mjs` to validate `<link rel*="icon">` / `apple-touch-icon` hrefs resolve inside `dist/`.
5. Update `public/README.md`, `public/MANIFEST.md`, `docs/MANIFEST.md`, `notes/MANIFEST.md`, `project/04-codebase-reference.md`, and `project/CHANGELOG.md`.

## Verification Check

- `npm run verify` (`dist/vib-tools-logo.png`, `dist/logos/vib-docs-engine.png`, favicons, webmanifest, zero broken links)
- `compile_applet` & `lint_applet` (`tsc --noEmit`)
- `npx --yes tsx --test src/utils/seo.test.ts src/utils/search.test.ts`
- `restart_dev_server` + headless Chromium (`playwright-cli`) inspection of `/` and `/vib-docs-engine/` in Dark and Light themes verifying `<img src="/vib-tools-logo.png">` and `<img src="/logos/vib-docs-engine.png">` load with `naturalWidth > 0` and favicons return HTTP `200`.

## Results

- Implemented and verified on 2026-11-18:
  - `npx --yes tsx --test src/utils/seo.test.ts src/utils/search.test.ts`: `8/8` passed.
  - `npm run verify`: `Build verification passed: 6 HTML files, 15 required assets, 1 projects, and no broken internal links.` (`dist/vib-tools-logo.png`, `dist/logos/vib-docs-engine.png`, and all `<link rel*="icon">` targets verified).
  - Headless Chromium (`http://localhost:3000/` & `http://localhost:3000/vib-docs-engine/` in Dark & Light themes): `/vib-tools-logo.png` and `/logos/vib-docs-engine.png` rendered at `180x180` (`complete: true`) in Header, Footer, ProjectCard, and Docs Topbar with `0` console errors.
