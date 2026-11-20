# 004 — SEO, Search Engine & AI Index Error Handling Inventory

- **Frozen Baseline Date:** `2026-11-20`
- **Method:** Direct source verification of all active fallback/validation guards + planned additions for `SEO2-Phase 01`–`04`.

---

## 1. Active Error Handling & Safety Guards (Verified in Current Source)

| Guard ID | File & Line Proof | Active Behavior |
| :--- | :--- | :--- |
| **`ACT-ERR-01`** | `src/utils/seo.ts:22-39` | `resolveOrigin()` & `resolveAbsoluteUrl()` normalize missing `https://` schemes, wrap `new URL(...)` in `try/catch`, and fall back safely without crashing static builds on malformed domain strings. |
| **`ACT-ERR-02`** | `src/utils/seo.ts:41-48` | `safeJsonLdStringify()` escapes `<`, `>`, `&`, U+2028, and U+2029 so Markdown headings/descriptions containing `</script>` cannot break out of `<script type="application/ld+json">`. |
| **`ACT-ERR-03`** | `src/utils/theme.ts:4-15,39-45` | `resolveAccentColor()` validates hex color patterns with `DEFAULT_ACCENT` fallback; `formatVersionBadge()` guards `null`/`undefined`/empty version values without double `"v"` prefixes. |
| **`ACT-ERR-04`** | `src/utils/llms.ts:66-85` | `readCleanMarkdownBody()` catches `readFile()` failures falling back to `entry.body`, strips YAML frontmatter safely via `gray-matter`, and emits `# <fallbackTitle>\n\n<summary>` when a body is empty. |
| **`ACT-ERR-05`** | `src/pages/[product]/[...slug].astro:30-48,70-71` | Explicitly throws build-time errors if a manifest project has zero matching collection entries, a collection entry lacks a matching `flatPage`, or an entry vanishes during rendering. |
| **`ACT-ERR-06`** | `src/pages/[product]/[...slug].md.ts:46-49` | Returns explicit `404` (`"Document not found."`) if an entry is missing during static endpoint generation. |
| **`ACT-ERR-07`** | `src/components/ui/SearchModal.astro:204-232,251-254,311-318,466-500,652-659` | Wraps `JSON.parse`, `localStorage`, and `URLSearchParams` in `try/catch`; validates same-origin URLs via `safeResultUrl()`; uses `DOMParser` whitelist (`appendSafeExcerpt`) stripping non-`MARK` tags; uses `searchSequence` stale-response cancellation; shows clean empty/unavailable status when Pagefind index is absent. |
| **`ACT-ERR-08`** | `src/layouts/HubLayout.astro:17-35` | Verifies `brandLogo` resolves within `public/` and exists on disk (`existsSync`) before rendering `<img>`, falling back to SVG `<BookOpen>` icon; wraps `new URL(site.domain)` in `try/catch`. |
| **`ACT-ERR-09`** | `scripts/verify-build.mjs:481-639` | Validates `_routes.json`, `_redirects`, `package-lock.json`, `.node-version`/`.nvmrc`, JSON-LD syntax across all HTML files, `404.html` `noindex`, missing manifest HTML/Markdown routes, and internal `href` / `img[src]` / `link[icon]` targets inside `dist/`. |
| **`ACT-ERR-10`** | `src/pages/[product]/llms.txt.ts:21-29` | Routes `/<product>/llms.txt` generation exclusively through `resolveProductEntries()` and `buildProductLlmsText()` (`readCleanMarkdownBody()`), preventing crashes on empty bodies or frontmatter leakage. |
| **`ACT-ERR-11`** | `astro.config.mjs:170-194` | Wraps `src/generated/manifest.json` `generatedAt` timestamp lookup (`resolveBuildLastmodIso()`) in `try/catch` + `Number.isNaN(Date.parse(...))` with ISO timestamp fallback and defensive `/404` sitemap filter. |
| **`ACT-ERR-12`** | `src/layouts/BaseLayout.astro:33-43,60,71-85` | Guards `canonicalUrl` construction with `try/catch` and cleanly suppresses `<link rel="canonical">` + social `og:*`/`twitter:*` share tags whenever `canonicalPath === null` or `robots` contains `noindex`. |
| **`ACT-ERR-13`** | `src/utils/seo.ts:89-162` & `src/layouts/DocsLayout.astro:80-91` | `buildDocBreadcrumbs()` normalizes folder segments (`cleanSeoRouteSegment`) and matches against `product.flatPages`, rendering unlinked labels when a folder lacks `index.md` so broken 404 breadcrumb links are never emitted. |
| **`ACT-ERR-14`** | `src/utils/seo.ts:164-282` | `buildHubJsonLd()` and `buildDocJsonLd()` safely fall back when `projects` is empty or `category`/`version`/`logoUrl` fields are absent, defaulting schema `image` to `site.brandLogo` or `/og-default.png`. |
| **`ACT-ERR-15`** | `src/components/ui/SearchModal.astro:418-424,481-513` & `src/layouts/DocsLayout.astro:61-68,109-112` | Caps live Pagefind detail fetches (`response.results.slice(0, 20)`) with accurate `"Showing X of Y results"` reporting, wraps fallback URL title parsing in `try/catch`, injects `data-pagefind-weight="10"` safely onto Markdown `<h1>`, and binds `data-pagefind-meta="product[data-product-name], title[data-doc-title]"` via attributes so commas/semicolons in titles cannot corrupt Pagefind metadata. |
| **`ACT-ERR-16`** | `scripts/verify-build.mjs:526-687` | Enforces automated SEO/AI build gates failing production builds on missing or `> 512 KB` `og-default.png`, missing `<product>/llms.txt` metadata lines, canonical/OG tags leaking onto `404.html`, `<h1> !== 1` or empty `<title>`/`description`, missing canonical on indexable routes, or `sitemap-0.xml` `/404`/count/`<lastmod>` mismatches. |

---

## 2. Planned SEO, Search & AI Index Error Handling Additions

| Planned Guard ID | Target Phase | File | Exact Defensive / Error Behavior to Add |
| :--- | :--- | :--- | :--- |
| **`ERR-SEO-01`** | `SEO2-Phase 01` | `src/pages/[product]/llms.txt.ts` | **Implemented (`ACT-ERR-10`)** in `SEO2-Phase 01`. |
| **`ERR-SEO-02`** | `SEO2-Phase 01` | `astro.config.mjs` | **Implemented (`ACT-ERR-11`)** in `SEO2-Phase 01`. |
| **`ERR-SEO-03`** | `SEO2-Phase 01` | `src/layouts/BaseLayout.astro` | **Implemented (`ACT-ERR-12`)** in `SEO2-Phase 01`. |
| **`ERR-SEO-04`** | `SEO2-Phase 02` | `src/utils/seo.ts` & `src/layouts/DocsLayout.astro` | **Implemented (`ACT-ERR-13`)** in `SEO2-Phase 02`. |
| **`ERR-SEO-05`** | `SEO2-Phase 02` | `src/utils/seo.ts` | **Implemented (`ACT-ERR-14`)** in `SEO2-Phase 02`. |
| **`ERR-SEO-06`** | `SEO2-Phase 03` | `src/components/ui/SearchModal.astro` & `src/layouts/DocsLayout.astro` | **Implemented (`ACT-ERR-15`)** in `SEO2-Phase 03` (hardened in `SEO2-Phase 04` browser QA). |
| **`ERR-SEO-07`** | `SEO2-Phase 04` | `scripts/verify-build.mjs` | **Implemented (`ACT-ERR-16`)** in `SEO2-Phase 04`. |
