# 002 — Step-by-Step Phase Roadmap & Patch Blueprints (SEO, Search Engine & AI Index)

- **Baseline Reference:** `notes/001-baseline-freeze-and-seo-forensic-audit.md` (`2026-11-20`)
- **Rule:** Execute **one phase at a time** strictly inside its Scope Lock. Verify unit tests and `npm run verify` after each phase before moving to the next. Never alter `.vibtools/` schema (`project/05-frozen-vibtools-schema.md`).

---

## `SEO2-Phase 01` — AI Index Parity, Edge Crawl Hygiene, `404` SEO & Sitemap `<lastmod>`

- **Resolves:** `BUG-SEO-01`, `BUG-SEO-02`, `BUG-SEO-03`, `BUG-SEO-04`
- **Scope-Locked Files:**
  - `src/pages/[product]/llms.txt.ts`
  - `src/utils/llms.test.ts` (new unit test file for `llms.ts`)
  - `public/_headers` & `nginx.conf`
  - `src/layouts/BaseLayout.astro` & `src/pages/404.astro`
  - `astro.config.mjs`

### Step-by-Step Implementation Blueprint
1. **Unify `/<product>/llms.txt` (`src/pages/[product]/llms.txt.ts`):**
   - Import `resolveProductEntries` and `buildProductLlmsText` from `../../utils/llms`.
   - Replace the duplicated inline loop (`lines 23–88`) with:
     ```ts
     const pageEntries = resolveProductEntries(project, entries);
     const body = await buildProductLlmsText(project, pageEntries, manifest.site.domain);
     ```
   - Add `src/utils/llms.test.ts` asserting `buildRootLlmsText`, `buildProductLlmsText`, and `buildSingleDocMarkdownText` emit `Markdown Entry:`, `.vibtools Config JSON Schema:`, and YAML-free output.
2. **Edge Headers (`public/_headers` & `nginx.conf`):**
   - On `/*.md` in `public/_headers` and `location ~* \.md$` in `nginx.conf`: add `X-Robots-Tag: noindex, follow` and `Access-Control-Allow-Origin: *` (prevents raw `.md` files from competing with HTML routes in Google Search while allowing cross-origin AI fetching).
   - On `/llms.txt`, `/llms-full.txt`, `/*/llms.txt`, and `/schemas/*.json` (and matching `nginx.conf` locations): add `Access-Control-Allow-Origin: *`.
   - On `/404.html` / `/404` if served directly: ensure HTML already contains `noindex, follow` (edge headers remain valid).
3. **`404.astro` + `BaseLayout.astro` SEO Hygiene:**
   - Extend `BaseLayout.astro` `Props` with `canonicalPath?: string | null` and `includeSocialMeta?: boolean` (or auto-suppress `<link rel="canonical">` and OpenGraph/Twitter share tags when `canonicalPath === null` or `robots?.includes("noindex")`).
   - Update `src/pages/404.astro`: pass `title="Page Not Found"`, `description="The requested documentation page could not be found on Vib Tools."`, `canonicalPath={null}`, `robots="noindex, follow"`, and `projects={manifest.projects}` so 404 has a unique title, zero self-canonical on a 404 URL, and real product links in footer.
   - Update `HubLayout.astro` `Props` to forward optional `title`, `description`, and `canonicalPath`.
4. **Sitemap `<lastmod>` & Defensive Filter (`astro.config.mjs`):**
   - Configure `sitemap({ filter: (page) => !/\/404\/?$/i.test(page), serialize: (item) => ({ ...item, lastmod: buildLastmodIso }) })` reading `src/generated/manifest.json` `generatedAt` (with current Date ISO fallback) so every `<url>` in `dist/sitemap-0.xml` includes accurate `<lastmod>`.

### Phase 01 Verification Gate
- `npm test` (`llms.test.ts` + existing 17 tests pass)
- `npm run lint` (`0` TS errors)
- `STRICT_SYNC=1 npm run verify`
- Confirm in `dist/`: `dist/readbox/llms.txt` has `Markdown Entry:` & `.vibtools Config JSON Schema:`, `dist/404.html` has NO `<link rel="canonical">`, `dist/sitemap-0.xml` includes `<lastmod>`, and `dist/_headers` includes `X-Robots-Tag` + CORS.

---

## `SEO2-Phase 02` — Compact SERP `<title>`, Clickable Folder Breadcrumbs & Rich JSON-LD

- **Resolves:** `BUG-SEO-05`, `BUG-SEO-06`, `BUG-SEO-07`
- **Scope-Locked Files:**
  - `src/layouts/BaseLayout.astro`
  - `src/layouts/DocsLayout.astro`
  - `src/utils/seo.ts`
  - `src/utils/seo.test.ts`
  - `src/pages/index.astro`

### Step-by-Step Implementation Blueprint
1. **Compact Non-Truncating SERP `<title>` (`BaseLayout.astro` & `DocsLayout.astro`):**
   - Add an optional `titleMode?: "portal" | "compact"` or `pageTitleOverride` prop on `BaseLayout.astro`:
     - Hub `/` keeps exact `Vib Tools Documentation`.
     - Subpages/Doc pages use compact brand suffix `| ${siteConfig.brandName}` (`"| Vib Tools"` instead of `"| Vib Tools Documentation"` — saves 14 chars on every doc page!).
   - In `DocsLayout.astro`, normalize redundant `"Documentation"` / `"User Documentation"` suffix when composing `<Page Title> — <Product>` so ReadBox titles render e.g. `User accounts, administrators, permissions and audit — ReadBox | Vib Tools` instead of repeating `"Documentation"` twice!
2. **Clickable Folder Breadcrumbs & Deduped Root Breadcrumb (`DocsLayout.astro`):**
   - Resolve each intermediate directory segment path (`/${product.slug}/${accumulatedDirs.join("/")}/`) against `new Set(product.flatPages.map((p) => normalizeRoutePath(p.route)))`.
   - When the folder overview route exists (e.g., `/calgrid/getting-started/`, `/readbox/features/`):
     - HTML `<nav aria-label="Breadcrumb">` renders `<a href={folderRoute}>` instead of a dead `<span>`.
     - JSON-LD `BreadcrumbList` includes `"item": folderRoute`.
   - When `canonicalPath === "/${product.slug}/"` (product root page), emit a clean 2-item `BreadcrumbList` (`Docs` -> `<Product Title>`) instead of duplicating the root URL in positions 2 & 3.
3. **Rich Schema.org JSON-LD (`src/utils/seo.ts`, `src/pages/index.astro`, `src/utils/seo.test.ts`):**
   - Update `buildHubJsonLd(site, projects)`:
     - Keep `@id` `Organization` (add `description: site.portalSubtitle`, `ImageObject` `logo`) + `WebSite` (`inLanguage: "en"`, `SearchAction`).
     - Add `CollectionPage` (`@id: ${origin}/#collection`, `about` / `mainEntity` `ItemList` of `SoftwareApplication` nodes for every product in `projects` with `name`, `url`, `description`, `applicationCategory`, `softwareVersion`, `image` if `logoUrl`).
   - Update `buildDocJsonLd(input)`:
     - Add `inLanguage: "en"`, `author: { "@id": "${origin}/#organization" }`, `articleSection: product.category`, `image: resolveAbsoluteUrl(product.logoUrl || "/og-default.png", origin)`.
     - Enrich `about` (`SoftwareApplication`) with `url: resolveAbsoluteUrl("/" + product.slug + "/", origin)` and `applicationCategory: product.category`.
   - Expand `src/utils/seo.test.ts` covering Hub `CollectionPage`/`ItemList`, `TechArticle` richness, and BreadcrumbList deduplication/folder URLs.

### Phase 02 Verification Gate
- `npm test` (`seo.test.ts` + all unit tests pass)
- `npm run lint` & `npx astro check` / `npm run verify`
- Inspect `dist/index.html`, `dist/readbox/features/admin-and-accounts/index.html`, `dist/calgrid/getting-started/installation/index.html`, and `dist/calgrid/index.html` confirming title lengths, clickable breadcrumbs, and valid rich JSON-LD.

---

## `SEO2-Phase 03` — Optimized `og-default.png`, Non-Blocking Fonts, Footer AI Links & Pagefind Search Polish

- **Resolves:** `BUG-SEO-08`, `BUG-SEO-09`
- **Scope-Locked Files:**
  - `public/og-default.png`
  - `src/layouts/BaseLayout.astro`
  - `src/layouts/HubLayout.astro`
  - `src/layouts/DocsLayout.astro`
  - `src/components/ui/SearchModal.astro`

### Step-by-Step Implementation Blueprint
1. **Social Card Image Optimization (`public/og-default.png`) & Meta Tags (`BaseLayout.astro`):**
   - Re-encode/resize `public/og-default.png` cleanly to canonical `1200x630` pixels and `< 200 KB` (down from `1.28 MB`, `1731x909`) keeping the exact Vib Tools branding clean and sharp.
   - Emit `<meta name="author" content={siteConfig.brandName} />`, `<meta property="og:locale" content="en_US" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`, and `<meta name="twitter:image:alt" content={pageTitle} />` (only when social meta is enabled — i.e., omitted on `noindex` 404).
2. **Non-Render-Blocking Font CSS (`BaseLayout.astro`):**
   - Switch Google Fonts `<link rel="stylesheet">` to async preload/print swap (`media="print" onload="this.media='all'"` + `<noscript>` fallback) so mobile first paint is not blocked on third-party CSS.
3. **Footer AI Discovery (`HubLayout.astro`):**
   - Add `/llms-full.txt` (`Full AI Corpus`) and `/schemas/vibtools-docs.schema.json` (`Config Schema`) under `Resources` alongside `/llms.txt` and `/sitemap-index.xml`.
4. **Pagefind Weight Consistency & Search Result UX (`DocsLayout.astro`, `SearchModal.astro`):**
   - In `DocsLayout.astro`: ensure `data-pagefind-meta={`product:${product.title};title:${pageTitle}`}` is set consistently on `<article>` AND add `data-pagefind-weight="10"` onto the primary Markdown `<h1>` (or wrap title metadata cleanly) so all `46` doc pages rank H1 matches equally.
   - In `SearchModal.astro`: slice `response.results.slice(0, 20)` before calling `Promise.all(...result.data())` (keeping total count accurate via `response.results.length`) and display the concise section breadcrumb via `formatBreadcrumb(href, data.meta?.product)` below/beside the title in live search results.

### Phase 03 Verification Gate
- Verify `public/og-default.png` dimensions (`1200x630`) and size (`< 250 KB`).
- Run `npm test`, `npm run lint`, and `npm run verify`.

---

## `SEO2-Phase 04` — Automated SEO/AI Verification Gate (`verify-build.mjs`), Docs Sync & Browser Audit

- **Resolves:** `BUG-SEO-10`
- **Scope-Locked Files:**
  - `scripts/verify-build.mjs`
  - `project/04-codebase-reference.md`
  - `project/CHANGELOG.md`
  - `notes/003`–`005`

### Step-by-Step Implementation Blueprint
1. Upgrade `scripts/verify-build.mjs` SEO/AI audit checks:
   - Assert `dist/404.html` includes `noindex` and **omits** `<link rel="canonical">`.
   - Assert every indexable HTML page in `dist/` has exact `1` `<h1>`, non-empty `<title>`, and non-empty `<meta name="description">`.
   - Assert `dist/sitemap-0.xml` includes `<lastmod>` and matches the indexable HTML page count.
   - Assert every `/<product>/llms.txt` includes `Markdown Entry:` and `.vibtools Config JSON Schema:`.
   - Assert `public/og-default.png` exists and is `<= 512 KB`.
2. Update `project/04-codebase-reference.md` and `project/CHANGELOG.md` with verified changes.
3. Run final `npm test && STRICT_SYNC=1 npm run verify && npm run lint && npx tsc -p functions/tsconfig.json --noEmit`, plus live Playwright inspection (`computer-use` skill) on `http://localhost:3000` (`/` Hub, `/calgrid/`, `/readbox/features/admin-and-accounts/`, `/404`, SearchModal, Mobile + Desktop, Light + Dark).
