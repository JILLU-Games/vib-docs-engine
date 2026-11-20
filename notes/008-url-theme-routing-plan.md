# Plan: URL Theme Query Routing (`?theme=light|dark`, Option A) (`2026-11-20`)

## Goal

Allow any portal or documentation route (`/`, `/{product}/`, `/{product}/{slug}/`, `/404`) to open directly in `light` or `dark` mode via URL query parameter (`?theme=light|dark`, with `?themes=` accepted as an alias) using **Option A**: URL query overrides `localStorage("theme")` before first paint, persists to `localStorage`, and toggling the UI theme switch synchronizes/updates any active theme query parameter in the URL without polluting clean URLs during normal browsing.

## Inspected Files

- `src/layouts/BaseLayout.astro`
- `src/components/ui/ThemeToggle.astro`
- `src/utils/theme.ts`
- `src/styles/global.css`
- `astro.config.mjs`
- `docs/portal-user-guide.md`
- `src/utils/MANIFEST.md`

## Implementation Steps

1. **Pure URL theme helpers & unit tests (`src/utils/theme.ts` + `src/utils/theme.test.ts`):**
   - Add `ThemeMode` (`"light" | "dark"`), `normalizeThemeMode`, `resolveThemeFromSearch` (`?theme=` primary + `?themes=` alias, trimmed/case-insensitive), `resolveInitialTheme`, and `syncThemeQueryInUrl` (rewrites `?theme=<nextTheme>` and drops `?themes` only when an explicit query override is already present; returns `null` for clean URLs).
   - Add `node:test` coverage in `src/utils/theme.test.ts` for `?theme=light`, `?theme=dark`, `?themes=` alias, uppercase/whitespace normalization, invalid query fallback, precedence over `localStorage`, and `syncThemeQueryInUrl` URL cleanup/preservation.
2. **Pre-paint head bootstrap (`src/layouts/BaseLayout.astro`):**
   - Update the inline `<script is:inline>` bootstrap in `<head>` to check `URLSearchParams(window.location.search)` (`theme` then `themes`), apply `.dark` and `dataset.theme` synchronously before paint, and persist a valid query override to `localStorage.setItem("theme", theme)` so subsequent doc navigation stays in the requested theme.
3. **Interactive toggle URL sync (`src/components/ui/ThemeToggle.astro`):**
   - Import `syncThemeQueryInUrl` from `../../utils/theme` inside `ThemeToggle.astro`'s client script and call `window.history.replaceState(null, "", nextUrl)` when toggling on a URL that carries `?theme=` or `?themes=`, keeping hash fragments intact and leaving clean URLs untouched.
4. **Verify & Document:**
   - Run `npm test`, `npm run lint`, `compile_applet`, `STRICT_SYNC=1 npm run verify`, and `restart_dev_server`.
   - Verify end-to-end in headless Chromium (`playwright-cli`) across `/?theme=light`, sidebar navigation persistence, `/calgrid/getting-started/?themes=dark`, `ThemeToggle` click + reload URL sync, invalid `?theme=blue` fallback, and normal clean URL toggle behavior.
   - Update `notes/008`, `src/utils/MANIFEST.md`, `project/04-codebase-reference.md`, `docs/portal-user-guide.md`, and `project/CHANGELOG.md`.

## Progress & Results

- Added `ThemeMode`, `normalizeThemeMode`, `resolveThemeFromSearch`, `resolveInitialTheme`, and `syncThemeQueryInUrl` in `src/utils/theme.ts` and `node:test` coverage in `src/utils/theme.test.ts`.
- Updated the pre-paint inline `<head>` bootstrap in `src/layouts/BaseLayout.astro` to prioritize `?theme=light|dark` (plus `?themes=` alias), persist valid query overrides to `localStorage("theme")`, and safely ignore invalid query values.
- Updated `src/components/ui/ThemeToggle.astro` to call `syncThemeQueryInUrl` and `window.history.replaceState` when toggling on URLs carrying `?theme=` or `?themes=`, keeping clean URLs untouched during normal navigation.
- Updated `src/utils/MANIFEST.md`, `project/04-codebase-reference.md`, `docs/portal-user-guide.md`, and `project/CHANGELOG.md`.
- Verified `npm test` (`31/31` pass), `npm run lint` (`tsc --noEmit`), `compile_applet`, `STRICT_SYNC=1 npm run verify` (`48` HTML files, `16` required assets, `2` projects, `0` broken links), and live Playwright Chromium journeys across `/?theme=light`, internal doc navigation persistence, `/calgrid/getting-started/?themes=dark`, toggle + reload URL sync, `?theme=invalid` fallback, and clean-URL toggle (`0` console errors/warnings).
