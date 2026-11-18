# 009 — SEO & AI Search Optimization Roadmap and Scope Locks

**Date:** `2026-11-18`
**Prerequisite Baseline:** `notes/008-baseline-freeze-and-seo-forensic-audit.md`
**Goal:** Execute all 8 audit fixes (`SEO-AUDIT-01` – `SEO-AUDIT-08`) in 4 compact, strictly scope-locked phases with **zero visual/UI regressions**.

---

## 1. Phase Roadmap Overview

| Phase | Target Objective | Audit IDs | Strictly Locked Files | Untouched Guarantees |
| :--- | :--- | :--- | :--- | :--- |
| **SEO-Phase 01** | Core Technical SEO, `404` `noindex`, OpenGraph Article Type & Robots Hygiene | `SEO-AUDIT-01`, `SEO-AUDIT-02`, `SEO-AUDIT-03` | `src/layouts/BaseLayout.astro`, `src/layouts/DocsLayout.astro` (props only), `src/pages/404.astro` (props only), `src/pages/robots.txt.ts` | Header, Hero, Footer, Cards, SearchModal, ThemeToggle, CSS, Scripts, Cloudflare Functions |
| **SEO-Phase 02** | Schema.org Structured Data (`JSON-LD`) & Safe Serializer | `SEO-AUDIT-04` | `src/utils/seo.ts` *(new)*, `src/utils/seo.test.ts` *(new)*, `src/layouts/BaseLayout.astro`, `src/pages/index.astro` *(head prop only)*, `src/layouts/DocsLayout.astro` | All visible UI/markup in Hero, Cards, Reader, TOC, PrevNext, Footer, SearchModal |
| **SEO-Phase 03** | AI Search Engine Index (`/llms-full.txt`, Per-Page `.md`, Discovery `<link>`s & Headers) | `SEO-AUDIT-05`, `SEO-AUDIT-06` | `src/utils/llms.ts` *(new)*, `src/pages/llms.txt.ts`, `src/pages/[product]/llms.txt.ts`, `src/pages/llms-full.txt.ts` *(new)*, `src/pages/[product]/[...slug].md.ts` *(new)*, `src/layouts/BaseLayout.astro`, `src/layouts/DocsLayout.astro`, `public/_headers` | Visual UI, Hero/Footer, `scripts/sync-docs.mjs`, `SearchModal.astro`, `wrangler.toml`, `functions/*` |
| **SEO-Phase 04** | `?q=` SearchAction Handler, Pagefind Relevance Tuning, Build Verifier & Docs Sync | `SEO-AUDIT-07`, `SEO-AUDIT-08` | `src/components/ui/SearchModal.astro` *(script only)*, `src/layouts/DocsLayout.astro`, `scripts/verify-build.mjs`, `scripts/export-portal.mjs` *(verify only)*, `src/MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` | Visual UI/CSS of Hero, Header, Footer, Cards, Reader, Cloudflare Functions |

---

## 2. Detailed Per-Phase Scope Lock Specifications

### SEO-Phase 01 — Technical Meta, `404` `noindex`, `og:type` & `robots.txt`
- **Why First:** Fixes crawl budget waste and search-engine `<head>` semantics cleanly before adding structured data.
- **Exact File Locks:**
  1. `src/layouts/BaseLayout.astro`:
     - Extend `Props`: `ogType?: "website" | "article"`, `robots?: string`.
     - Render `<meta name="robots" content={robots} />` when `robots` is provided (default omitted / indexable).
     - Replace hardcoded `og:type="website"` with `ogType`.
     - Add `<meta property="og:image:alt" content={pageTitle} />` and `<link rel="sitemap" type="application/xml" href="/sitemap-index.xml" />`.
  2. `src/layouts/HubLayout.astro`:
     - Optional pass-through `robots?: string` prop ONLY if needed for `404.astro` (strictly forward prop to `<BaseLayout>` — zero markup/CSS edits).
  3. `src/pages/404.astro`:
     - Pass `robots="noindex, follow"` so `dist/404.html` explicitly blocks indexing.
  4. `src/layouts/DocsLayout.astro`:
     - Pass `ogType="article"` to `<BaseLayout>`.
  5. `src/pages/robots.txt.ts`:
     - Add `Disallow: /pagefind/` under `User-agent: *` and keep `Sitemap: .../sitemap-index.xml`.
- **Verification Check:** Build + `inspect dist/404.html`, `dist/index.html`, `dist/vib-docs-engine/index.html`, `dist/robots.txt` + `tsc --noEmit` + `verify-build.mjs`.

---

### SEO-Phase 02 — Schema.org Structured Data (`JSON-LD`)
- **Why Separate:** Pure data modeling and XSS-safe serialization deserve dedicated unit tests (`node:test`) independent of HTML templates.
- **Exact File Locks:**
  1. `src/utils/seo.ts` *(new)*:
     - `safeJsonLdStringify(data: unknown)`: serializes JSON escaping `<`, `>`, `&`, `\u2028`, `\u2029` to prevent `</script>` breakout.
     - `buildHubJsonLd(site)`: emits `Organization` + `WebSite` with `SearchAction` (`target: "{domain}/?q={search_term_string}"`).
     - `buildDocJsonLd({ site, product, pageTitle, description, canonicalUrl, breadcrumbs })`: emits `TechArticle` (`headline`, `description`, `url`, `about` software name + `version`) + `BreadcrumbList` (`ListItem` positions `1..N`).
  2. `src/utils/seo.test.ts` *(new)*:
     - Unit tests verifying schema types, `SearchAction` URI template, `BreadcrumbList` ordering, and `</script>` HTML-escape safety.
  3. `src/layouts/BaseLayout.astro` (+ `HubLayout.astro` optional `structuredData?: unknown` pass-through):
     - Render `<script type="application/ld+json" set:html={safeJsonLdStringify(structuredData)} />` when provided.
  4. `src/pages/index.astro`:
     - Pass `structuredData={buildHubJsonLd(manifest.site)}` to `HubLayout` (zero visual changes).
  5. `src/layouts/DocsLayout.astro`:
     - Pass `structuredData={buildDocJsonLd(...)}` to `BaseLayout` (zero reader UI changes).
- **Verification Check:** `npx --yes tsx --test src/utils/seo.test.ts`, `compile_applet`, `lint_applet`, inspect parsed `<script type="application/ld+json">` from `dist/index.html` and `dist/vib-docs-engine/deployment/index.html`.

---

### SEO-Phase 03 — AI Search Engine Indexes (`/llms-full.txt`, Per-Page `.md` & Edge Headers)
- **Why Separate:** Reuses a single content-collection reader so `/llms.txt`, `/{product}/llms.txt`, `/llms-full.txt`, and per-page `.md` stay 100% DRY and consistent.
- **Exact File Locks:**
  1. `src/utils/llms.ts` *(new)*:
     - Shared helpers to resolve ordered non-draft product pages from `docs` collection, strip YAML frontmatter via `gray-matter`, normalize clean Markdown, and construct root `llms.txt`, product `llms.txt`, and `llms-full.txt` text.
     - Also compute canonical clean Markdown URL for each doc page (e.g., `/${product.slug}/index.md` for root product index, `/${product.slug}/deployment.md` or `/${pagePath}/index.md` — wait: check static routing conflict vs Cloudflare clean URLs! Emitting `/${product.slug}.md` or `/${product.slug}/.../page.md` as static `.md` files like `/vib-docs-engine/index.md` & `/vib-docs-engine/deployment.md` avoids directory collision with Astro `index.html` folders!).
  2. `src/pages/llms.txt.ts` & `src/pages/[product]/llms.txt.ts`:
     - Use shared `src/utils/llms.ts` helper; expose `/llms-full.txt` link in `dist/llms.txt`.
  3. `src/pages/llms-full.txt.ts` *(new)*:
     - Emits complete cross-product portal documentation in a single clean UTF-8 text endpoint (`Content-Type: text/plain; charset=utf-8`).
  4. `src/pages/[product]/[...slug].md.ts` *(new, static `APIRoute`)*:
     - Emits raw clean UTF-8 Markdown (`Content-Type: text/markdown; charset=utf-8`) for every `flatPage` (handling root product page `/vib-docs-engine/index.md` and subpages `/vib-docs-engine/deployment.md` cleanly — verify exact route parity with `astro build` static output!).
  5. `src/layouts/BaseLayout.astro` & `src/layouts/DocsLayout.astro`:
     - Add `<link rel="alternate" type="text/plain" title="LLMs.txt" href="/llms.txt" />` on all pages, plus `<link rel="alternate" type="text/markdown" title={`${pageTitle} (Markdown)`} href={markdownAltPath} />` and product `llms.txt` `<link>` on doc pages.
  6. `public/_headers`:
     - Add explicit `Content-Type: text/plain; charset=utf-8` + `Cache-Control` for `/llms-full.txt`, and `Content-Type: text/markdown; charset=utf-8` rules for `/*.md` and `/*/*.md`.
- **Verification Check:** Confirm `dist/llms-full.txt` and per-page `.md` files exist in `dist/`, verify `verify-build.mjs` handles `.md` hrefs cleanly, inspect `<link rel="alternate">` in HTML.

---

### SEO-Phase 04 — `?q=` SearchAction Support, Pagefind Tuning, Verifier & Docs Sync
- **Why Last:** Ties `SearchAction` (`/?q=...`) end-to-end into `SearchModal.astro`, optimizes Pagefind weighting, upgrades `verify-build.mjs` to enforce every new SEO/AI artifact permanently, and updates project docs.
- **Exact File Locks:**
  1. `src/components/ui/SearchModal.astro` *(client `<script>` enhancement only — zero UI/markup/CSS change)*:
     - On initialization, read `new URLSearchParams(window.location.search).get("q")`; if non-empty, safely sanitize/trim (`slice(0, 120)`), open modal, fill input, and run Pagefind search.
     - Keep `history.replaceState` cleanup optional/safe when clearing or closing `?q=`.
  2. `src/layouts/DocsLayout.astro`:
     - Add `data-pagefind-weight="10"` on fallback `<h1>` and `data-pagefind-ignore="all"` on `<nav aria-label="Breadcrumb">` so breadcrumbs never pollute Pagefind search excerpts/terms.
  3. `scripts/verify-build.mjs`:
     - Add `"llms-full.txt"` to `requiredFiles`.
     - Verify per-page `.md` files exist in `dist/` for every `project.flatPages` entry.
     - Verify `dist/404.html` contains `noindex`.
     - Parse and validate all `<script type="application/ld+json">` tags in `dist/*.html` (especially `dist/index.html` and product pages).
  4. Governance & Durable Docs:
     - `notes/010-seo-phase-execution-tracker.md`, `notes/012-actual-implementation-matrix.md`, `src/MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`.
- **Verification Check:** `compile_applet`, `lint_applet`, `node scripts/verify-build.mjs`, `npx --yes tsx --test src/utils/*.test.ts`, and Chromium browser test verifying `http://localhost:3000/?q=deployment` opens SearchModal automatically with results!

---

## 3. Strict Untouchable Boundary (Scope Lock Guarantee)

The following areas MUST remain **100% untouched** across all 4 SEO phases:
- Header layout & styles (`HubLayout.astro` `<header>`, `Topbar.astro`)
- Home Hero visual design, Quick Guides card, `ProjectCard.astro`, `CategoryTabs.astro`, and 4-column Footer layout
- Docs Sidebar (`Sidebar.astro`, `SidebarTree.astro`), `TableOfContents.astro`, `PrevNextNav.astro`, `ThemeToggle.astro`
- Global Tailwind design tokens (`src/styles/global.css`)
- Cloudflare runtime infrastructure (`wrangler.toml`, `functions/api/*`, `public/_redirects`, `public/_routes.json`)
- Git sync & config presets (`scripts/sync-docs.mjs`, `scripts/add-project.mjs`, `config/*`)

> **Bangla Summary (রোডম্যাপ ও স্কোপ লক):** পুরো SEO ও AI Search আপডেটকে ৪টি ছোট এবং রিস্ক-ফ্রি ফেজে ভাগ করা হয়েছে: **Phase 01** (Meta/`404` `noindex`/`robots.txt`), **Phase 02** (Schema.org JSON-LD + Test), **Phase 03** (`llms-full.txt` + প্রতি পেজের `.md` + Edge Headers), এবং **Phase 04** (`?q=` SearchAction + Pagefind Tuning + `verify-build.mjs` + Docs Sync)। প্রতিটি ফেজে **Scope Lock** থাকায় UI, Header, Hero, Footer বা Cloudflare config-এ কোনো অপ্রয়োজনীয় হাত দেওয়া হবে না।
