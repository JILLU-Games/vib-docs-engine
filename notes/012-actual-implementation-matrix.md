# 012 — Actual Implementation Matrix (Working vs Pending)

**Last Baseline Verified:** `2026-11-18`
**Rule:** Only mark an item as **ACTUAL WORKING** after code is implemented, built (`compile_applet` + `tsc --noEmit`), verified (`verify-build.mjs`), and tested.

---

## 1. Actual Working Features Right Now (Frozen Baseline `2026-11-18`)

| Domain | Feature | Source Location | Status |
| :--- | :--- | :--- | :--- |
| **Content Sync** | Git sparse-checkout multi-product sync (`dev` local fallback + per-project `secretKey`/`GIT_TOKEN` + draft/`MANIFEST.md` strip) | `scripts/sync-docs.mjs` | **ACTUAL WORKING** |
| **Sidebar & Content** | Deterministic nested sidebar ordering, subfolder `index.md` titles, MDX `<Callout>` / `<CodeTabs>`, remark external `_blank` + relative `.md` link rewrite | `src/utils/sidebar.ts`, `astro.config.mjs`, `src/pages/[product]/[...slug].astro` | **ACTUAL WORKING** |
| **Portal Architecture** | Dual-portal presets (`user-portal` / `dev-portal`) & standalone exporter | `config/presets/*`, `scripts/export-portal.mjs` | **ACTUAL WORKING** |
| **Hub UI** | 3-slot balanced Header (`Vib Tools / Docs`), Split Hero + CTA + `Quick Guides` card, `CategoryTabs`, `ProjectCard` grid, 4-column Footer | `src/layouts/HubLayout.astro`, `src/pages/index.astro`, `src/components/hub/*` | **ACTUAL WORKING** |
| **Docs Reader UI** | 3-column reading layout (`Topbar`, `Sidebar`, `TableOfContents`, `PrevNextNav`, Breadcrumb) | `src/layouts/DocsLayout.astro`, `src/components/docs/*` | **ACTUAL WORKING** |
| **Client Search UI** | Centered command palette (`Ctrl+K` / `/` / trigger buttons), product vs all scope toggle, `Recently viewed` (`localStorage`), `Suggested` links, arrow/Enter keyboard navigation, runtime Pagefind highlights | `src/components/ui/SearchModal.astro`, `src/utils/search.ts` | **ACTUAL WORKING** |
| **Themes & Branding** | Light / Dark theme toggle (no-flash boot script), official Vib Tools PNG logo, `.ico`/`.png`/Apple touch icons, `site.webmanifest`, `og-default.png` | `src/layouts/BaseLayout.astro`, `src/components/ui/ThemeToggle.astro`, `public/*` | **ACTUAL WORKING** |
| **Basic SEO & AI** | Dynamic `<title>` & description, `rel="canonical"`, OpenGraph/Twitter tags, `@astrojs/sitemap`, `/robots.txt`, `/llms.txt`, `/{product}/llms.txt` (YAML stripped) | `BaseLayout.astro`, `robots.txt.ts`, `llms.txt.ts`, `[product]/llms.txt.ts` | **ACTUAL WORKING** |
| **Cloudflare Deployment** | Node `22.24.0` pin, `package-lock.json`, `wrangler.toml`, Edge `_headers`/`_redirects`/`_routes.json`, `GET /api/health`, `POST /api/webhook` (HMAC-SHA256 + `ALLOWED_BRANCHES`), build verifier | `wrangler.toml`, `functions/api/*`, `public/_*`, `scripts/verify-build.mjs` | **ACTUAL WORKING** |

---

## 2. Newly Added Features Per SEO Update Phase *(Live Log)*

| Phase | Features Actually Implemented & Verified | Completion Date |
| :--- | :--- | :--- |
| **SEO-Phase 01** | `404.html` `noindex, follow`, `og:type="article"` on docs routes, `og:image:alt`, `<link rel="sitemap">`, protocol-safe domain origin guard, `Disallow: /pagefind/` in `robots.txt` | `2026-11-18` |
| **SEO-Phase 02** | XSS-safe Schema.org JSON-LD (`src/utils/seo.ts` + `seo.test.ts`): `Organization` + `WebSite` (`SearchAction`) on `/` and `TechArticle` + `BreadcrumbList` on doc pages | `2026-11-18` |
| **SEO-Phase 03** | Shared `src/utils/llms.ts`, root `/llms-full.txt`, per-page clean static Markdown files (`*.md`), `<link rel="alternate">` AI discovery links, UTF-8 `text/markdown` & `/llms-full.txt` `_headers` | `2026-11-18` |
| **SEO-Phase 04** | URL `?q=` `SearchAction` auto-search + cleanup (`SearchModal.astro`), Pagefind `h1` weight & breadcrumb ignore (`DocsLayout.astro`), automated JSON-LD/`noindex`/`llms-full.txt`/`.md` build verifier (`verify-build.mjs`) | `2026-11-18` |

---

## 3. Remaining / Pending Implementation (Not Implemented Yet)

| Feature | Current State | Planned Phase |
| :--- | :--- | :--- |
| *(None — all planned Search Engine SEO & AI Search Index items in `SEO-Phase 01`–`04` are implemented and verified)* | **ALL COMPLETE** | — |

> **Bangla Summary (অ্যাকচুয়াল ইমপ্লিমেন্টেশন ম্যাট্রিক্স):** বর্তমানে অ্যাপে কোন কোন ফিচার আসলেই কাজ করছে এবং SEO-র কোন কোন অংশ এখনো বাকি আছে তার সম্পূর্ণ তালিকা এখানে ফ্রিজ করা হলো। প্রতিটি ফেজ শেষ হলেই "Pending" থেকে "Actual Working" সেকশনে তা যুক্ত হবে।
