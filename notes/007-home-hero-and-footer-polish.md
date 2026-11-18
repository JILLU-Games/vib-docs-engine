# Home Hero & Footer Clean UI Plan & Log (2026-11-18)

## Goal

Upgrade the Hub home page Hero (`src/pages/index.astro`) and Footer (`src/layouts/HubLayout.astro`) into a compact, GitHub/Stripe/Cloudflare-inspired layout driven exclusively by `manifest.json` / `config/site.config.json` data, while keeping headers, cards, docs reader, and search behavior intact.

## Implementation Steps

1. Update `src/pages/index.astro`:
   - Pass `projects={manifest.projects}` to `HubLayout`.
   - Replace bare title/subtitle intro with a clean `border-b` split Hero (`grid lg:grid-cols-[minmax(0,1fr)_22rem]`): title, subtitle, `Browse {primaryProject.title}` CTA + `Search docs (Ctrl K)` button on left; real `Quick Guides` panel from `buildQuickSuggestions(manifest.projects, 3)` on right.
   - Keep `CategoryTabs` and `ProjectCard` grid below with a compact `Documentation` section label.
2. Update `src/layouts/HubLayout.astro` footer only:
   - Accept optional `projects` prop (`ManifestProject[]` subset).
   - Render a clean 4-column compact footer (`Brand`, `Documentation`, `Resources` -> `/llms.txt` & `/sitemap-index.xml`, `Connect` -> `site.navLinks`) plus a hairline bottom bar (`© {year} {site.brandName}` and canonical domain hostname).
3. Verify via `compile_applet`, `lint_applet`, `node scripts/verify-build.mjs`, `export-portal` smoke check, and headless Chromium captures (`1440x900` dark/light + `390x844` mobile).

## Results

- Updated `src/pages/index.astro` with a split manifest-driven Hero (primary project CTA, `Search docs` trigger wired to `[data-search-trigger]`, and `Quick Guides` panel via `buildQuickSuggestions`) plus a compact `Documentation` project count header.
- Updated `src/layouts/HubLayout.astro` footer into a compact 4-column structure (`Brand`, `Documentation`, `Resources` -> `/llms.txt` & `/sitemap-index.xml`, `Connect` -> `site.navLinks`) with a hairline copyright and canonical domain strip, keeping `<header>` untouched.
- Verified `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs` (`6` HTML files, `14` required assets, `1` projects, `0` broken links), `npx --yes tsx --test src/utils/search.test.ts` (`4/4`), and Chromium captures across Dark/Light Desktop (`1440x900`) and Mobile (`390x844`) with `0` console errors and `0` horizontal overflow (`overflowX: false`).
