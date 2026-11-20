# 001 — Frozen Baseline & Forensic Audit Report (SEO, Search Engine, AI Search & AI Index)

- **Baseline Freeze Date:** `2026-11-20T09:07:30-08:00`
- **Active Portal Domain:** `https://docs.vib.tools` (`portalType: "users"`, `wrangler.toml`: `name = "docs-vib-tools"`)
- **Engine Release:** `vib-docs-engine@1.0.0` (`package.json`)
- **Active Registered Products (`config/projects.json`):** `CalGrid` (`v1.0.2`, `32` doc pages, `/logos/calgrid.png`), `ReadBox User Documentation` (`v0.1.0`, `14` doc pages, `/logos/readbox.svg`)
- **Frozen Build Snapshot:** `48` static HTML files (`dist/`), `47` URLs in `dist/sitemap-0.xml`, `46` Pagefind-indexed pages (`2,309` words), `16` required assets, `17/17` unit tests passing, `0` broken internal links.
- **Immutable Architecture Boundary:** `.vibtools/` docs config schema (`project/05-frozen-vibtools-schema.md`, `/schemas/vibtools-docs.schema.json`) and unrelated UI/sync/Cloudflare Functions remain **100% locked and unchanged**.

---

## 1. Baseline-Matched Forensic Findings (`BUG-SEO-01` – `BUG-SEO-10`)

Every defect below is verified directly against checked-in source code and compiled `dist/` build output:

| Bug ID | Severity | Exact Source / Asset Proof | Observed Built `dist/` Mismatch / Defect | Assigned Phase |
| :--- | :--- | :--- | :--- | :--- |
| **`BUG-SEO-01`** | **High** | `src/utils/llms.ts:148-197` vs `src/pages/[product]/llms.txt.ts:21-96` | `src/pages/[product]/llms.txt.ts` bypasses `buildProductLlmsText()` and omits `Markdown Entry:`, `.vibtools Config JSON Schema:`, `[Markdown]` links, and empty-body fallback. `dist/calgrid/llms.txt` & `dist/readbox/llms.txt` both report `has Markdown Entry: false`. | `SEO2-Phase 01` |
| **`BUG-SEO-02`** | **High** | `public/_headers:15-37`, `nginx.conf:48-81`, `src/pages/robots.txt.ts:13` | `/*.md` (`46` raw Markdown routes) have `Allow: /` and zero `X-Robots-Tag: noindex, follow` or canonical HTTP `Link` header (duplicate-content risk vs HTML docs). `/llms*.txt`, `/*.md`, and `/schemas/*.json` also lack `Access-Control-Allow-Origin: *` for browser AI/schema tools. | `SEO2-Phase 01` |
| **`BUG-SEO-03`** | **High** | `src/pages/404.astro:7`, `src/layouts/BaseLayout.astro:35,56,64-74`, `src/layouts/HubLayout.astro:29` | `dist/404.html` emits `<link rel="canonical" href="https://docs.vib.tools/404/">`, `<meta property="og:url" content="https://docs.vib.tools/404/">`, identical homepage `<title>Vib Tools Documentation</title>`, and empty `projects` (rendering `"Portal Home"` in footer). | `SEO2-Phase 01` |
| **`BUG-SEO-04`** | **Medium-High** | `astro.config.mjs:188` vs `dist/sitemap-0.xml` | Bare `sitemap()` emits `<url><loc>...</loc></url>` with zero `<lastmod>` freshness signals and no defensive `filter` excluding `/404`. | `SEO2-Phase 01` |
| **`BUG-SEO-05`** | **High** | `src/layouts/DocsLayout.astro:26`, `src/layouts/BaseLayout.astro:29-31` | `BaseLayout` appends full `portalTitle` (`" | Vib Tools Documentation"`, 23 chars) to every doc title. **14/14 ReadBox pages** reach `81–107` chars (truncating product & `"Vib Tools"` brand in Google SERPs and repeating `"Documentation"` twice). | `SEO2-Phase 02` |
| **`BUG-SEO-06`** | **Medium** | `src/layouts/DocsLayout.astro:32-37,82-87` | Intermediate folder segments (`Getting Started`, `Features`) render as unlinked `<span>` in HTML `<nav aria-label="Breadcrumb">` and omit `"item"` URLs in `BreadcrumbList` JSON-LD even when `/<product>/<folder>/` index routes exist; product root pages emit duplicate Level 2 & Level 3 URLs. | `SEO2-Phase 02` |
| **`BUG-SEO-07`** | **Medium-High** | `src/utils/seo.ts:50-151`, `src/pages/index.astro:14` | Hub `buildHubJsonLd` omits `CollectionPage`/`ItemList` of published products (`CalGrid`, `ReadBox`). Doc `buildDocJsonLd` omits `inLanguage`, `author`, `articleSection`, `image`, and `SoftwareApplication.applicationCategory`/`url`. | `SEO2-Phase 02` |
| **`BUG-SEO-08`** | **Medium-High** | `public/og-default.png`, `src/layouts/BaseLayout.astro:46-83`, `src/layouts/HubLayout.astro:130-144` | `public/og-default.png` is `1,279,746` bytes (`1.28 MB`, `1731x909`) risking social unfurl failures; `BaseLayout` omits `og:locale`, `og:image:width/height`, `twitter:image:alt`, `author`, and loads Google Fonts synchronously; Footer `Resources` omits `/llms-full.txt` & `/schemas/vibtools-docs.schema.json`. | `SEO2-Phase 03` |
| **`BUG-SEO-09`** | **Medium** | `src/layouts/DocsLayout.astro:99-104`, `src/components/ui/SearchModal.astro:414-436,481` | Only `!hasContentH1` fallback `<h1>` (`14/46` ReadBox pages) gets `data-pagefind-weight="10"`, while `32/46` Markdown-H1 pages (`CalGrid`) have zero H1 search weight; `SearchModal` materializes unbounded `response.results` and hides route breadcrumbs on live results. | `SEO2-Phase 03` |
| **`BUG-SEO-10`** | **Medium** | `scripts/verify-build.mjs:546-607` | Verifier does not check `404.html` canonical absence, `<h1>` count == 1 per page, `<title>`/`<meta description>` completeness, `sitemap-0.xml` count + `<lastmod>`, or `<product>/llms.txt` `Markdown Entry:` + schema parity. | `SEO2-Phase 04` |

---

## 2. Strict Scope Lock Boundaries (Per Phase)

| Phase | Target Scope | Explicit Allowed Files | Explicit Forbidden / Unchanged Boundaries |
| :--- | :--- | :--- | :--- |
| **`SEO2-Phase 01`** | AI Index Parity, Crawl Headers, `404` SEO Hygiene & Sitemap `<lastmod>` | `src/pages/[product]/llms.txt.ts`, `src/utils/llms.ts` (if helper needed), `src/utils/llms.test.ts`, `public/_headers`, `nginx.conf`, `src/layouts/BaseLayout.astro`, `src/pages/404.astro`, `astro.config.mjs` | Zero changes to `.vibtools/` schema (`vibtoolsConfig.ts`, `vibtools-docs.schema.json.ts`), `sync-docs.mjs`, UI CSS/theme tokens, Hub hero/cards, or Cloudflare Functions. |
| **`SEO2-Phase 02`** | Compact SERP `<title>`, Clickable Folder Breadcrumbs & Rich Schema.org JSON-LD | `src/layouts/BaseLayout.astro`, `src/layouts/DocsLayout.astro`, `src/utils/seo.ts`, `src/utils/seo.test.ts`, `src/pages/index.astro` | Zero changes to Pagefind UI, Tailwind styles, `sync-docs.mjs`, `.vibtools/` schema, `config/*.json`, or Markdown content files. |
| **`SEO2-Phase 03`** | Optimized `og-default.png` Social Cards, Non-Blocking Fonts, Footer AI Links & Pagefind Search Polish | `public/og-default.png`, `src/layouts/BaseLayout.astro`, `src/layouts/HubLayout.astro`, `src/layouts/DocsLayout.astro`, `src/components/ui/SearchModal.astro`, `src/utils/search.ts` | Zero visual redesign of Hero/Sidebar/Topbar/Cards; keep existing layout spacing, theme polarity, and `.vibtools/` schema unchanged. |
| **`SEO2-Phase 04`** | Automated SEO/AI Build Gates (`verify-build.mjs`), Documentation Sync & Final Full Browser/Build Verification | `scripts/verify-build.mjs`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/003`–`005` | No runtime code changes outside verifier assertions and governance docs; verify `STRICT_SYNC=1 npm run verify` + Playwright browser audit. |
