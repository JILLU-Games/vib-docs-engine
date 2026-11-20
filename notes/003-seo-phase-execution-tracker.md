# 003 — SEO & AI Search Phase Execution Tracker & Update Log

- **Frozen Baseline Date:** `2026-11-20` (`vib-docs-engine@1.0.0`, `docs.vib.tools` `portalType: "users"`)
- **Last Updated:** `2026-11-20`
- **Overall Progress:** **`4 / 4` Phases Completed** · **`0` Phases Remaining**

---

## Quick Status Dashboard

| Phase | Target Bugs | Status | Completed Features / Fixes | Remaining Next Work | Scope Lock Respected? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SEO2-Phase 01`** | `BUG-SEO-01`–`04` | **Completed** | Unified `[product]/llms.txt.ts` via `buildProductLlmsText` + added `llms.test.ts`; added `X-Robots-Tag: noindex, follow` on `/*.md` & CORS `*` on AI/schema endpoints; suppressed canonical/OG tags on `noindex` `404.html` + set distinct title & footer links; added `sitemap()` `/404` filter + `manifest.generatedAt` `<lastmod>` | — | **Yes (Verified)** |
| **`SEO2-Phase 02`** | `BUG-SEO-05`–`07` | **Completed** | Compact non-truncating SERP `<title>` (`\| Vib Tools` + deduplicated `"Documentation"`, max `74` chars across all `48` pages); clickable subfolder overview breadcrumbs + deduped root `BreadcrumbList`; Hub `CollectionPage`/`ItemList` (`SoftwareApplication` nodes) & enriched `TechArticle` (`inLanguage`, `author`, `articleSection`, `image`) | — | **Yes (Verified)** |
| **`SEO2-Phase 03`** | `BUG-SEO-08`–`09` | **Completed** | Optimized `public/og-default.png` (`1200x630`, `223,901` bytes); added `author`, `og:locale`, `og:image:width`/`height`, `twitter:image:alt` & non-blocking Google Fonts preload/swap in `BaseLayout.astro`; added `/llms-full.txt` & `/schemas/vibtools-docs.schema.json` to Footer `Resources` in `HubLayout.astro`; unified Pagefind `data-pagefind-weight="10"` across all `46` doc H1s + attribute-bound `product`/`title` metadata in `DocsLayout.astro`; capped `SearchModal.astro` fetch at `20` results with `"Showing X of Y"` status & route breadcrumbs | — | **Yes (Verified)** |
| **`SEO2-Phase 04`** | `BUG-SEO-10` | **Completed** | Enforced automated SEO/AI build gates (`ERR-SEO-07`) in `scripts/verify-build.mjs` (`og-default.png` `<= 512 KB`, product `llms.txt` parity, `404.html` no-canonical/no-OG, exact `1` `<h1>` + non-empty `<title>`/`description` + canonical across all `48` HTML files, `sitemap-0.xml` `<lastmod>` & count parity), fixed Pagefind `data-pagefind-meta` attribute binding discovered in browser QA, synced `project/`, and passed live Playwright audit | — | **Yes (Verified)** |

---

## Scope-Lock Non-Interference Checklist (Verify After Every Phase)

During all 4 phases, the following must remain **100% unchanged and verified intact**:
- `.vibtools/` docs config schema (`src/utils/vibtoolsConfig.ts`, `src/pages/schemas/vibtools-docs.schema.json.ts`, `project/05-frozen-vibtools-schema.md`)
- Git sparse checkout & sync logic (`scripts/sync-docs.mjs`, `scripts/add-project.mjs`, `scripts/export-portal.mjs`)
- Registered products & site branding (`config/projects.json`, `config/site.config.json`)
- Cloudflare Functions (`functions/api/health.ts`, `functions/api/webhook.ts`)
- Core UI layout geometry, compact density, light/dark themes, and sidebar sorting (`src/styles/global.css`, `src/utils/sidebar.ts`)

---

## Chronological Phase Execution Log

### `SEO2-Phase 01` — AI Index Parity, Crawl Headers, `404` SEO & Sitemap `<lastmod>`
- **Status:** `COMPLETED` (`1` of `4` completed · `3` phases remaining)
- **Implemented Updates:**
  - `src/pages/[product]/llms.txt.ts`: Replaced duplicated inline collection matching/stripping with shared `resolveProductEntries` and `buildProductLlmsText` (`src/utils/llms.ts`). Added `src/utils/llms.test.ts` (4 new unit tests).
  - `public/_headers` & `nginx.conf`: Added `X-Robots-Tag: noindex, follow` on `/*.md` and `Access-Control-Allow-Origin: *` across `/llms.txt`, `/llms-full.txt`, `/*/llms.txt`, `/*.md`, and `/schemas/*.json` (preserving security headers).
  - `src/layouts/BaseLayout.astro`, `src/layouts/HubLayout.astro`, `src/pages/404.astro`: Added `canonicalPath?: string | null` & `includeSocialMeta?: boolean`; suppressed `<link rel="canonical">` and OpenGraph/Twitter tags automatically on `noindex` routes; gave `404.astro` distinct `"Page Not Found"` title/description, `canonicalPath={null}`, and `projects={manifest.projects}` so footer lists `CalGrid` & `ReadBox User Documentation`.
  - `astro.config.mjs`: Added `resolveBuildLastmodIso()` reading `src/generated/manifest.json` `generatedAt` and configured `@astrojs/sitemap` with `filter: (page) => !/\/404(?:\.html)?\/?$/i.test(page)` and `<lastmod>` serialization.
- **Verification Proof:**
  - `npm test`: **`21 / 21` passing** (`17` existing + `4` new `llms.test.ts` assertions).
  - `npm run lint` & `npx tsc -p functions/tsconfig.json --noEmit`: **`0` TypeScript errors**.
  - `STRICT_SYNC=1 npm run verify`: **PASSED** (`Synced calgrid`, `Synced readbox`, `48` HTML files, `16` required assets, `2` projects, `46` Pagefind pages / `2,309` words, `0` broken internal links).
  - Built artifact audit: `dist/readbox/llms.txt` & `dist/calgrid/llms.txt` emit `Markdown Entry:`, `.vibtools Config JSON Schema:`, and `[Markdown]` links; `dist/404.html` has `noindex, follow`, zero `<link rel="canonical">`, zero `og:*`/`twitter:*` share meta, and distinct `<title>Page Not Found | Vib Tools Documentation</title>`; `dist/index.html` & `dist/calgrid/index.html` preserve canonical & OG tags intact; `dist/sitemap-0.xml` emits `<lastmod>2026-11-20T17:14:13.996Z</lastmod>` on all `47` URLs; `dist/_headers` contains `X-Robots-Tag` + CORS headers.
- **Scope-Lock Result:** Strictly confined to Phase 01 allowed files. `.vibtools/` schema, sync engine, UI styling, Hub hero/cards, Sidebar, SearchModal, and Cloudflare Functions untouched.

### `SEO2-Phase 02` — Compact SERP `<title>`, Clickable Folder Breadcrumbs & Rich JSON-LD
- **Status:** `COMPLETED` (`2` of `4` completed · `2` phases remaining)
- **Implemented Updates:**
  - `src/utils/seo.ts`: Added `normalizeProductSeoLabel()`, `buildDocDocumentTitle()`, `formatBaseTitle()`, `cleanSeoRouteSegment()`, and `buildDocBreadcrumbs()`; enriched `buildHubJsonLd(site, projects)` with `Organization.description`, `WebSite.inLanguage`, and `CollectionPage` + `ItemList` of `SoftwareApplication` nodes; enriched `buildDocJsonLd` with `inLanguage`, `author`, `articleSection`, `image`, and `SoftwareApplication.url`/`applicationCategory`.
  - `src/layouts/BaseLayout.astro`: Uses `formatBaseTitle()` so Hub `/` keeps `Vib Tools Documentation` while all subpages/docs use compact `| Vib Tools` suffix.
  - `src/layouts/DocsLayout.astro`: Uses `buildDocDocumentTitle()` and `buildDocBreadcrumbs()` so folder overviews link cleanly in `<nav aria-label="Breadcrumb">` + `BreadcrumbList` JSON-LD and product root overviews deduplicate cleanly (`Docs > Product > Overview`).
  - `src/pages/index.astro`: Passes `projects` into `buildHubJsonLd(manifest.site, projects)`.
  - `src/utils/seo.test.ts`: Expanded to cover compact titles, numbered/missing/nested folder breadcrumbs, `CollectionPage` `ItemList`, and enriched `TechArticle`.
- **Verification Proof:**
  - `npm test`: **`23 / 23` passing** (`seo.test.ts`, `llms.test.ts`, `search.test.ts`, `vibtoolsConfig.test.ts`).
  - `npm run lint` & `npx tsc -p functions/tsconfig.json --noEmit`: **`0` TypeScript errors**.
  - `STRICT_SYNC=1 npm run verify`: **PASSED** (`48` HTML files, `16` required assets, `2` projects, `46` Pagefind pages / `2,309` words, `0` broken internal links).
  - Built artifact audit across all `48` HTML files: max `<title>` length reduced from `107` to **`74` chars** (`0` titles over `80` chars); `dist/index.html` emits `["Organization","WebSite","CollectionPage"]` with `2` `SoftwareApplication` items; `dist/calgrid/guides/attachments/index.html` & `dist/readbox/features/admin-and-accounts/index.html` link folder overviews cleanly and emit full `TechArticle` fields; `dist/calgrid/index.html` dedupes `BreadcrumbList` (`2` items).
- **Scope-Lock Result:** Strictly confined to Phase 02 allowed 5 files (`BaseLayout.astro`, `DocsLayout.astro`, `seo.ts`, `seo.test.ts`, `index.astro`). `.vibtools/` schema, CSS tokens, Hero, Cards, Sidebar, SearchModal, `sync-docs.mjs`, and Cloudflare Functions untouched.

### `SEO2-Phase 03` — Optimized `og-default.png`, Async Fonts, Footer AI Links & Pagefind Polish
- **Status:** `COMPLETED` (`3` of `4` completed · `1` phase remaining)
- **Implemented Updates:**
  - `public/og-default.png`: Resized and palette-quantized cleanly from `1,279,746` bytes (`1731x909`) to **`223,901` bytes (`1200x630`, 8-bit sRGB PNG)** — an 82.5% social payload reduction under the `250 KB` target.
  - `src/layouts/BaseLayout.astro`: Added `<meta name="author" content={siteConfig.brandName} />`, `<meta property="og:locale" content="en_US" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`, and `<meta name="twitter:image:alt" content={pageTitle} />` (kept suppressed on `noindex` routes), and switched Google Fonts CSS to non-render-blocking `<link rel="preload" as="style">` + `media="print" onload="this.media='all'"` + `<noscript>` fallback.
  - `src/layouts/HubLayout.astro`: Added `/llms-full.txt` (`Full AI Corpus`) and `/schemas/vibtools-docs.schema.json` (`Config Schema`) links under Footer `Resources`.
  - `src/layouts/DocsLayout.astro`: Switched `<slot />` to `await Astro.slots.render("default")` to inject `data-pagefind-weight="10"` onto Markdown-rendered `<h1>` headings when `hasContentH1` is true (preserving ExpressiveCode stylesheets/scripts and single-`<h1>` invariants) and set `data-pagefind-meta={`product:${product.title};title:${pageTitle}`}`.
  - `src/components/ui/SearchModal.astro`: Capped detail hydration at `response.results.slice(0, 20)` (`Showing X of Y results` when truncated), added `try/catch` around URL fallback parsing, and rendered `formatBreadcrumb(href, data.meta?.product)` breadcrumbs below live search result titles.
- **Verification Proof:**
  - `npm test`: **`23 / 23` passing** (`seo.test.ts`, `llms.test.ts`, `search.test.ts`, `vibtoolsConfig.test.ts`).
  - `npm run lint` & `npx tsc -p functions/tsconfig.json --noEmit`: **`0` TypeScript errors**.
  - `STRICT_SYNC=1 npm run verify`: **PASSED** (`Synced calgrid`, `Synced readbox`, `48` HTML files, `16` required assets, `2` projects, `46` Pagefind pages / `2,352` words, `0` broken internal links).
  - Built artifact & asset audit across all `48` HTML files: `46/46` doc pages have exact `1` `<h1>` with `data-pagefind-weight="10"`, `data-pagefind-meta="product:...;title:..."`, and intact ExpressiveCode assets (`12` code-highlighted pages); `47/47` indexable pages emit `author`, `og:locale`, `og:image:width="1200"`, `og:image:height="630"`, `twitter:image:alt`, and non-blocking preload/print-swap Google Fonts; `dist/404.html` retains `noindex, follow` with zero canonical or OG/Twitter tags; `dist/index.html` & `dist/404.html` footers expose all 4 `Resources` links; `public/og-default.png` & `dist/og-default.png` verified `1200x630` at `223,901` bytes.
- **Scope-Lock Result:** Strictly confined to Phase 03 allowed 5 targets (`public/og-default.png`, `BaseLayout.astro`, `HubLayout.astro`, `DocsLayout.astro`, `SearchModal.astro`). `.vibtools/` schema, CSS tokens, Hero, Cards, Topbar, Sidebar, `sync-docs.mjs`, `verify-build.mjs`, and Cloudflare Functions untouched.

### `SEO2-Phase 04` — Automated SEO Verification Gate, Governance Docs & Final Browser Audit
- **Status:** `COMPLETED` (`4` of `4` completed · `0` phases remaining)
- **Implemented Updates:**
  - `scripts/verify-build.mjs` (`BUG-SEO-10`, `ERR-SEO-07`): Added automated build-time SEO & AI index verification gates:
    - Enforces `public/og-default.png` and `dist/og-default.png` byte size between `1` byte and `512 KB` (`524,288` bytes).
    - Enforces `Markdown Entry:` and `.vibtools Config JSON Schema:` presence in every `dist/<product>/llms.txt`.
    - Enforces `<meta name="robots" content="noindex, ...">`, zero `<link rel="canonical">`, and zero `og:*` / `twitter:*` social preview tags on `dist/404.html`.
    - Enforces non-empty `<title>`, non-empty `<meta name="description">`, exact `1` `<h1>` (excluding `<script>`/`<style>`), valid `<script type="application/ld+json">`, and absolute `https://` `<link rel="canonical">` on all `47` indexable HTML pages.
    - Enforces `dist/sitemap-0.xml` URL count matching the `47` indexable HTML pages, `/404` exclusion, and valid ISO `<lastmod>` on every `<url>` block.
  - `src/layouts/DocsLayout.astro` (Browser-QA Catch & Fix): Live Playwright search audit caught Pagefind treating `;title:...` inside a single `data-pagefind-meta` string as part of `meta.product`. Fixed to `data-pagefind-meta="product[data-product-name], title[data-doc-title]"` paired with `data-product-name={product.title}` and `data-doc-title={pageTitle}` so both `product` and comma-containing titles (`"User accounts, administrators, permissions and audit"`) parse cleanly.
  - `project/04-codebase-reference.md` & `project/CHANGELOG.md`: Synchronized function inventory and dated Phase 04 changelog entry.
- **Verification Proof:**
  - `npm test`: **`23 / 23` passing** (`seo.test.ts`, `llms.test.ts`, `search.test.ts`, `vibtoolsConfig.test.ts`).
  - `npm run lint` & `npx tsc -p functions/tsconfig.json --noEmit` & `compile_applet` + `lint_applet`: **`0` errors**.
  - `STRICT_SYNC=1 npm run verify`: **PASSED** (`Synced calgrid`, `Synced readbox`, `48` HTML files, `16` required assets, `2` projects, `46` Pagefind pages / `2,309` words, `0` broken internal links, `0` SEO/AI verifier errors).
  - Live Playwright Chromium Audit (`http://localhost:3000`):
    - Hub `/` (`1440x900` dark): `"Vib Tools Documentation"`, canonical `https://docs.vib.tools/`, `h1Count: 1`, JSON-LD `["Organization","WebSite","CollectionPage"]`, Footer `/llms.txt`, `/llms-full.txt`, `/schemas/vibtools-docs.schema.json`, `/sitemap-index.xml`, `overflowX: false`.
    - Scoped Search on `/calgrid/` (`"attachments"`): `12 results`, renders `"Drive Attachments"` with clean breadcrumb `"CalGrid › Guides › Attachments"`.
    - Global Hub Search (`"permissions"`): `11 results`, renders full comma-containing title `"User accounts, administrators, permissions and audit"`, badge `"ReadBox User Documentation"`, and breadcrumb `"ReadBox User Documentation › Features › Admin And Accounts"`.
    - Docs Light Mode (`/readbox/features/admin-and-accounts/`, `1440x900`): `theme: "light"`, clickable breadcrumb `Docs > ReadBox User Documentation > ReadBox Feature Guide Index`, `h1` `data-pagefind-weight="10"`, `overflowX: false`.
    - Mobile CalGrid (`/calgrid/`, `390x844` dark) & Mobile `404` (`/404`, `390x844`): `"Page Not Found | Vib Tools"`, `robots: "noindex, follow"`, `hasCanonical: false`, `hasOg: false`, `overflowX: false`, `0` runtime console errors on valid routes (expected HTTP `404` status log only on `/404`).
- **Scope-Lock Result:** Strictly confined to Phase 04 verifier/docs targets plus the targeted `DocsLayout.astro` Pagefind metadata fix caught during Playwright search testing. `.vibtools/` schema, CSS tokens, Hero, Cards, Sidebar, `sync-docs.mjs`, and Cloudflare Functions remain untouched.
