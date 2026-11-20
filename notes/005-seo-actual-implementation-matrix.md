# 005 — Actual Implementation Matrix (SEO, Search Engine, AI Search & AI Index)

- **Frozen Baseline Date:** `2026-11-20`
- **Portal Scope:** `https://docs.vib.tools` (`portalType: "users"`, `CalGrid` v1.0.2 + `ReadBox` v0.1.0)
- **Rule:** Record only source-verified and `dist/`-verified status. Update this matrix after each completed phase.

---

## Live Status Matrix

| Capability | Baseline Status (Verified `2026-11-20`) | Target Phase | Added / Updated After Phase | Remaining Work |
| :--- | :--- | :--- | :--- | :--- |
| Static HTML generation (`output: "static"`, `48` pages) | **Working** (`astro.config.mjs:177`) | Baseline | — | None |
| Single `<h1>` & unique 40–160 char `<meta description>` per page | **Working** (`48/48` HTML have 1 H1; `47/47` unique desc) | Baseline | **Working** (Automated `verify-build.mjs` gate enforced across all `48` HTML files) | None |
| `robots.txt` + XML Sitemap (`/sitemap-index.xml`) | **Working** (`47` URLs in `sitemap-0.xml`, `Allow: /`, `Disallow: /pagefind/`) | `SEO2-Phase 01` | **Working** (`manifest.generatedAt` `<lastmod>`, defensive `/404` filter, automated `verify-build.mjs` count + `<lastmod>` check) | None |
| Root `/llms.txt` & `/llms-full.txt` (`148 KB`) | **Working** (`src/pages/llms*.ts` -> `src/utils/llms.ts`) | `SEO2-Phase 01` | **Working** (`Access-Control-Allow-Origin: *` + linked in Footer `Resources`) | None |
| Per-page raw Markdown (`/<product>/<page>.md`, `46` files) | **Working** (`src/pages/[product]/[...slug].md.ts`) | `SEO2-Phase 01` | **Working** (Added `X-Robots-Tag: noindex, follow` + CORS `*` in `_headers` & `nginx.conf`) | None |
| Per-product `/<product>/llms.txt` (`calgrid`, `readbox`) | **Mismatched** (omits `Markdown Entry:` & schema link) | `SEO2-Phase 01` | **Working** (Unified via `buildProductLlmsText`, unit-tested, and enforced by `verify-build.mjs`) | None |
| `404.html` SEO hygiene | **Buggy** (emits `/404/` canonical, homepage title, no footer links) | `SEO2-Phase 01` | **Working** (`noindex, follow`, zero canonical/OG tags, `"Page Not Found"` title, footer links, automated `verify-build.mjs` gate) | None |
| SERP `<title>` length & brand suffix | **Buggy on ReadBox** (`14/14` pages `81–107` chars) | `SEO2-Phase 02` | **Working** (`formatBaseTitle` + `buildDocDocumentTitle`; `0` titles `> 80` chars, max `74` chars; `verify-build.mjs` non-empty gate) | None |
| Breadcrumb links + `BreadcrumbList` JSON-LD | **Partial** (folder spans unlinked; root duplicates URL) | `SEO2-Phase 02` | **Working** (`buildDocBreadcrumbs` links folder overviews & dedupes product root `BreadcrumbList`) | None |
| `Organization` + `WebSite` + `SearchAction` JSON-LD | **Working** (`src/utils/seo.ts:50-91`, `?q=` opens modal) | `SEO2-Phase 02` | **Working** (Added Hub `CollectionPage`/`ItemList` of `SoftwareApplication` nodes & enriched `TechArticle` fields) | None |
| Social preview `public/og-default.png` & OG meta tags | **Degraded** (`1.28 MB` `1731x909`; lacks `width/height/locale/author`) | `SEO2-Phase 03` | **Working** (`1200x630`, `223,901` bytes PNG + `author`, `og:locale`, `og:image:width`/`height`, `twitter:image:alt` + `verify-build.mjs` `<= 512 KB` gate) | None |
| Non-render-blocking typography loading | **Missing** (sync `<link rel="stylesheet">` for Google Fonts) | `SEO2-Phase 03` | **Working** (Async `rel="preload"` + `media="print" onload="this.media='all'"` + `<noscript>` fallback in `BaseLayout.astro`) | None |
| Footer AI & schema discovery links | **Partial** (`/llms.txt` & sitemap only) | `SEO2-Phase 03` | **Working** (Added `/llms-full.txt` & `/schemas/vibtools-docs.schema.json` to Footer `Resources` in `HubLayout.astro`) | None |
| Pagefind full-text search & ranking parity | **Partial** (`46` pages indexed; `32` Markdown-H1 pages lack weight `10`; uncapped fetch) | `SEO2-Phase 03` | **Working** (`46/46` doc H1s have `data-pagefind-weight="10"`, attribute-bound `product` + `title` metadata verified with commas, `20`-result cap, route breadcrumbs, live Playwright verified) | None |
| Automated SEO/AI verification gates | **Partial** (`verify-build.mjs` checks links/JSON-LD/404 `noindex`) | `SEO2-Phase 04` | **Working** (`verify-build.mjs` enforces `404` no-canonical/no-OG, H1/title/desc/canonical, sitemap count + `<lastmod>`, `llms.txt` parity, `og-default.png` `<= 512 KB`) | None |
