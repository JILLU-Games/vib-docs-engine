# 008 — Frozen Baseline & Search/AI SEO Forensic Audit Report

**Date:** `2026-11-18`
**Status:** Baseline Frozen — Planning Complete (No Code Changes Applied Yet)
**Audience:** Human Operators & Coding Agents (English + Bangla)

---

## 1. Frozen Baseline Snapshot (`2026-11-18`)

This document freezes the exact verified state of `vib-docs-engine` prior to starting the **Search Engine SEO & AI Search Index Optimization (`SEO-Phase 01` – `SEO-Phase 04`)** workstream.

### Verified Baseline Checkpoints
| Area | Verified State | Evidence / Verification |
| :--- | :--- | :--- |
| **Cloudflare Pages & Functions** | `CF-Phase 01`–`03` 100% complete (`wrangler.toml`, `.node-version`, `.nvmrc`, `functions/api/health.ts`, `functions/api/webhook.ts`, `public/_headers`, `public/_redirects`, `public/_routes.json`) | `npm run verify`, `tsc -p functions/tsconfig.json --noEmit` |
| **Brand & PWA Assets** | Authentic Vib Tools icons & manifests (`public/logos/vib-tools.png`, `favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-*.png`, `og-default.png`, `site.webmanifest`) | Verified by `scripts/verify-build.mjs` (`14` required assets) |
| **Hub UI (Header, Hero, Cards, Footer)** | Balanced `h-14` 3-slot Header (`HubLayout.astro`), compact split Hero + `Quick Guides` (`src/pages/index.astro`), `CategoryTabs` + `ProjectCard` grid, 4-column compact Footer | Verified in Chromium `1440x900` (Dark/Light) & `390x844` Mobile (`0` console errors) |
| **Docs Reader & Search Palette** | 3-column `DocsLayout.astro` + `Topbar.astro`, `SearchModal.astro` centered command palette with `Recently viewed` + `Suggested` links + keyboard navigation (`src/utils/search.ts`) | `npx --yes tsx --test src/utils/search.test.ts` (`4/4` pass), `tsc --noEmit` pass |
| **Basic SEO & AI Baseline** | Dynamic `<title>`, `<meta name="description">`, `<link rel="canonical">`, basic OpenGraph/Twitter tags, `@astrojs/sitemap`, `/robots.txt`, `/llms.txt`, `/{product}/llms.txt`, and Pagefind `dist/pagefind/*` | Inspected in `dist/` (`6` HTML files, `0` broken links) |

> **Bangla Summary (বেসলাইন ফ্রিজ):** `2026-11-18` তারিখে অ্যাপের Cloudflare build, Vib Tools branding, Header, Home Hero, Compact Footer, Docs Reader এবং Search Modal ১০০% কাজ করছে ও verify করা হয়েছে। এই স্ট্যাবল অবস্থাকেই **Baseline** ধরে এখন শুধু Search Engine SEO এবং AI Search Engine Index optimize করার প্ল্যান তৈরি করা হলো।

---

## 2. Forensic Audit — Search Engine SEO & AI Search Indexing

Inspected files: `src/layouts/BaseLayout.astro`, `src/layouts/DocsLayout.astro`, `src/layouts/HubLayout.astro`, `src/pages/index.astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `src/pages/llms.txt.ts`, `src/pages/[product]/llms.txt.ts`, `src/pages/[product]/[...slug].astro`, `src/components/ui/SearchModal.astro`, `public/_headers`, `astro.config.mjs`, `scripts/verify-build.mjs`, and built outputs under `dist/`.

### Findings Summary

| ID | Category | Severity | Exact File & Current Gap | Required Outcome | Scope-Locked Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SEO-AUDIT-01`** | Technical SEO | High | `src/pages/404.astro` + `src/layouts/BaseLayout.astro`: `404.html` renders without `<meta name="robots" content="noindex, follow">` | Support optional `noindex?: boolean` on `BaseLayout.astro` and enable it on `404.astro` | **SEO-Phase 01** |
| **`SEO-AUDIT-02`** | Social / Meta | High | `src/layouts/BaseLayout.astro:42-51` & `src/layouts/DocsLayout.astro`: hardcodes `og:type="website"` on documentation articles; missing `og:image:alt` and `<link rel="sitemap" type="application/xml" href="/sitemap-index.xml" />` | Support `ogType?: "website" \| "article"` (`"article"` in `DocsLayout.astro`), add `og:image:alt` and head sitemap discovery link | **SEO-Phase 01** |
| **`SEO-AUDIT-03`** | Crawl Hygiene | Medium | `src/pages/robots.txt.ts`: allows crawling `/pagefind/` (WASM/binary search chunks) and lacks pointer comment/directive for `/llms.txt` | Keep `Allow: /`, add `Disallow: /pagefind/` so search bots do not waste crawl budget on search index binaries | **SEO-Phase 01** |
| **`SEO-AUDIT-04`** | Structured Data | High | `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/layouts/DocsLayout.astro`: zero Schema.org JSON-LD blocks emitted anywhere in `dist/*.html` | Add XSS-safe `src/utils/seo.ts` builders for `WebSite` (with `SearchAction`) + `Organization` on Hub `/`, and `TechArticle` + `BreadcrumbList` on doc pages | **SEO-Phase 02** |
| **`SEO-AUDIT-05`** | AI Search Index | High | `src/pages/` & `public/_headers`: `/{product}/llms.txt` exists per product, but root `/llms-full.txt` (all products' full docs) does not exist | Add `src/utils/llms.ts` shared generator, emit root `/llms-full.txt`, link it from `/llms.txt`, and add `Content-Type: text/plain; charset=utf-8` in `public/_headers` | **SEO-Phase 03** |
| **`SEO-AUDIT-06`** | AI Per-Page Markdown | High | `src/pages/[product]/`: AI agents crawling an individual doc URL have no raw Markdown sibling URL or `<link rel="alternate" type="text/markdown">` | Generate static clean Markdown files for every doc page (e.g. `/{product}/index.md`, `/{product}/deployment/index.md` or `/*.md`) + `<link rel="alternate" type="text/markdown">` & `<link rel="alternate" type="text/plain">` in `<head>` | **SEO-Phase 03** |
| **`SEO-AUDIT-07`** | Site Search (`?q=`) & Relevance | Medium | `src/components/ui/SearchModal.astro` & `src/layouts/DocsLayout.astro`: URL `?q=...` query is ignored (breaking Schema `SearchAction` target `/?q={search_term_string}`); article `<h1>` lacks `data-pagefind-weight` and non-prose elements lack explicit Pagefind guards | Parse `?q=` on load to open + populate `SearchModal.astro` safely; tune Pagefind weights/ignores in `DocsLayout.astro` | **SEO-Phase 04** |
| **`SEO-AUDIT-08`** | Build Guardrails | Medium | `scripts/verify-build.mjs`: checks `llms.txt` & `sitemap-index.xml`, but does not check `llms-full.txt`, per-page `.md` exports, `404.html` `noindex`, or valid `<script type="application/ld+json">` JSON parsing | Extend `scripts/verify-build.mjs` to assert SEO & AI index parity on every build | **SEO-Phase 04** |

### Exact Proof of Current Behavior
- **No JSON-LD (`SEO-AUDIT-04`)**: `src/layouts/BaseLayout.astro` lines `30–70` contain `<title>`, `<meta name="description">`, `rel="canonical"`, OpenGraph, Twitter, Favicons, Webmanifest, and Google Fonts only — zero `application/ld+json`.
- **Hardcoded `og:type` (`SEO-AUDIT-02`)**: `src/layouts/BaseLayout.astro:42` always writes `<meta property="og:type" content="website" />` even when rendered from `DocsLayout.astro`.
- **Missing `404` `noindex` (`SEO-AUDIT-01`)**: `src/pages/404.astro` wraps `<HubLayout>` -> `<BaseLayout>` with no `<meta name="robots">` tag.
- **No `/pagefind/` disallow (`SEO-AUDIT-03`)**: `src/pages/robots.txt.ts:8` outputs only `User-agent: *\nAllow: /\n\nSitemap: ...`.
- **No `/llms-full.txt` or per-page `.md` (`SEO-AUDIT-05`, `SEO-AUDIT-06`)**: `dist/` currently contains only `dist/llms.txt` and `dist/{product}/llms.txt`. Zero `.md` outputs exist under `dist/`.
- **No `?q=` support (`SEO-AUDIT-07`)**: `SearchModal.astro` listens only to `vib:open-search`, `Ctrl/Cmd + K`, `/` key, and `[data-search-trigger]` clicks — it never inspects `window.location.search`.

> **Bangla Summary (ফরেনসিক অডিট):** পুরো কোড এবং বিল্ড আউটপুট (`dist/`) পরীক্ষা করে মোট **৮টি SEO ও AI Search ঘাটতি (`SEO-AUDIT-01` থেকে `SEO-AUDIT-08`)** পাওয়া গেছে। মূলত Schema.org JSON-LD নেই, 404 page-এ `noindex` নেই, `og:type="article"` সেট করা নেই, AI crawler-দের জন্য root `/llms-full.txt` ও প্রতি পেজের raw `.md` ভার্সন নেই, `robots.txt`-এ `/pagefind/` ব্লক করা নেই, এবং URL `?q=` search handler নেই।
