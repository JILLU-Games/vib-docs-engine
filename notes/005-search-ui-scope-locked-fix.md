# Search UI Scope-Locked Fix Plan & Log (2026-11-18)

## Goal

Fix all visual, positioning, interaction, and theme-contrast bugs in the Search Trigger and Search Modal/Dropdown UI while remaining strictly locked to Search UI components (`SearchModal.astro`, trigger buttons in `HubLayout.astro` and `Topbar.astro`).

## Scope Lock

- In-scope: `src/components/ui/SearchModal.astro`, trigger button polish in `src/layouts/HubLayout.astro` and `src/components/docs/Topbar.astro`, and helper logic if needed for recently viewed / search formatting.
- Out-of-scope: Pagefind indexing, sync/build scripts, portal config, sidebar/hub/prose design outside search triggers and search dialog.

## Implementation Steps

1. Center the search dialog horizontally (`flex items-start justify-center px-3 pt-10 sm:pt-14`) with `max-w-xl mx-auto` and smooth fade/slide transition + scrollbar gutter compensation on body overflow lock.
2. Hide native `-webkit-search-cancel-button` to eliminate double `×` buttons; provide single clean Clear button + `ESC` pill/cap + accessible `Close` on mobile.
3. Add missing `flex` class on `[data-search-scope-bar]` so `Current Product Only` and `All Docs` align horizontally.
4. Use `:global(.search-palette mark)` so dynamic Pagefind highlight marks use subtle `--accent-color` tint instead of default neon yellow.
5. Add Stripe-style compact initial empty state (`Recently Viewed` via `localStorage` + real `Quick Links` from `manifest.json`), clean file/hash icons, route breadcrumbs, result padding/dividers, and bottom keyboard hint bar (`↑↓ Navigate`, `↵ Open`, `ESC Close`).
6. Add `cursor-pointer` and crisp interactive hover feedback on `[data-search-trigger]` (`HubLayout.astro`) and `[data-doc-search-trigger]` (`Topbar.astro`).
7. Verify with `compile_applet`, `lint_applet`, `npm run verify`, and live headless Chromium captures (Dark + Light, Desktop + Mobile, Empty State + `deploy` query).

## Results

- Completed & verified on 2026-11-18:
  - `npx --yes tsx --test src/utils/search.test.ts`: `4/4` unit tests passed.
  - `npm run verify`: built `6` HTML files, `14` required assets, `0` broken links.
  - `compile_applet` & `lint_applet` (`tsc --noEmit`): `0` errors.
  - Headless Chromium visual & DOM verification (`1440x900` dark/light + `390x844` mobile): horizontally centered (`left: 420, width: 600` on `1440`), `barDisplay: "flex"`, accent-tinted `:global(.search-palette mark)`, single clear button, `Recently viewed` + `Suggested` quick navigation, and `0` console errors.
