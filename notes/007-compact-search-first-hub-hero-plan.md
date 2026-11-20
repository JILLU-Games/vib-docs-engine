# Plan: Compact Search-First Multi-Product Hub Hero (`2026-11-20`)

## Goal

Make the `docs.vib.tools` home Hero section compact, balanced across all onboarded products, and free of duplicate search controls — aligned with professional multi-product documentation portals while preserving SEO, JSON-LD, Pagefind SearchModal, dark/light themes, and the frozen `.vibtools/` schema.

## Inspected Files

- `src/pages/index.astro`
- `src/layouts/HubLayout.astro`
- `src/utils/search.ts`
- `src/utils/search.test.ts`
- `src/pages/404.astro`
- `src/styles/global.css`

## Implementation Steps

1. **Add pure multi-product onboarding helper (`src/utils/search.ts` + `src/utils/search.test.ts`):**
   - Implement `buildBalancedStartLinks(projects, limit)` returning one onboarding/getting-started link per product in round-robin order (prioritizing `getting-started` / `installation` / `quickstart` routes over root overview when available) so the Hero never biases toward `projects[0]`.
   - Add `node:test` assertions covering multi-product fairness, onboarding priority, and limit handling.
2. **Eliminate duplicate home search trigger (`src/layouts/HubLayout.astro`):**
   - Add optional `showHeaderSearch = true` prop on `HubLayout.astro` so `/404` and other hub routes retain header search while `src/pages/index.astro` passes `showHeaderSearch={false}` when rendering the Hero search bar.
3. **Compact Hero layout (`src/pages/index.astro`):**
   - Replace the tall split hero (`Browse CalGrid` CTA + 3-row right-hand `Quick Guides` aside) with a compact single-column search-first Hero (`py-5 sm:py-6`), `font-medium` title, 1-line subtitle, single prominent `Search guides, setup manuals, or troubleshooting...` trigger (`[data-search-trigger]`), and a single balanced `Start here:` shortcut strip powered by `buildBalancedStartLinks()`.
   - Slightly tighten the `Documentation` section top padding (`py-6 sm:py-7`) so `CategoryTabs` and `ProjectCard` sit clearly above the fold.
4. **Verify & Document:**
   - Run `npm test`, `STRICT_SYNC=1 npm run verify`, `compile_applet`, `lint_applet`, `restart_dev_server`.
   - Inspect live rendered `/` across Desktop Dark (`1440x900`), Desktop Light (`1440x900`), Mobile (`390x844`), and SearchModal trigger + category filtering in headless Chromium via `playwright-cli`.
   - Update `notes/007`, `project/04-codebase-reference.md`, and `project/CHANGELOG.md`.

## Progress & Results

- Added `buildBalancedStartLinks(projects, limit)` in `src/utils/search.ts` and unit coverage in `src/utils/search.test.ts` so Hub onboarding links balance across all products (`CalGrid` + `ReadBox`) rather than favoring `projects[0]`.
- Added optional `showHeaderSearch` prop (`true` by default) to `src/layouts/HubLayout.astro` so `/` renders a single prominent Search trigger inside the Hero while `/404` retains its header search bar.
- Redesigned `src/pages/index.astro` Hero into a compact search-first multi-product strip (`py-5 sm:py-6`, `font-medium` heading, single wide search trigger, balanced `Start here:` shortcuts, and tightened `py-6 sm:py-7` product section) and refined mobile placeholder/separator wrapping from Playwright visual inspection.
- Updated `project/04-codebase-reference.md` and `project/CHANGELOG.md`; verified `npm test` (`27/27`), `STRICT_SYNC=1 npm run verify`, `tsc --noEmit`, `compile_applet`, and headless Chromium captures (Desktop Dark/Light + Mobile `390x844`).
