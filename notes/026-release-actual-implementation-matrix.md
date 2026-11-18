# 026 — Release Readiness Actual Implementation Matrix

**Baseline Frozen:** `2026-11-18` (`vib-docs-engine@0.1.0`)
**Rule:** Mark items **ACTUAL WORKING** only after code is implemented, verified by `npm test`, `npm run lint`, `tsc -p functions/tsconfig.json --noEmit`, `npm run verify`, and runtime checks where applicable. Keep unfixed/deferred items explicitly labeled **PENDING**.

---

## 1. Verified Actual Working Features (Frozen Baseline)

| Domain | Verified Working Capabilities Today | Authoritative Files | Current Status |
| :--- | :--- | :--- | :--- |
| **`.vibtools/` & Dual-Portal Sync** | `docs.config.json` & `config.docs.json` alias, 2-step sparse checkout, `portalType` (`users`/`developer`/`all`) filtering, `.vibtools/logo.*` & `logoPath` security validation, Smart Markdown H1/summary/`vX.Y.Z` fallback, bare `repoUrl` CLI `--url`, root `.vibtools/` build verifier | `src/utils/vibtoolsConfig.ts`, `scripts/sync-docs.mjs`, `scripts/add-project.mjs`, `scripts/verify-build.mjs` | **ACTUAL WORKING** *(with `AUDIT-F02`, `AUDIT-F04` edge fixes queued)* |
| **Static Hub, Reader & UI** | Responsive Hub (`390px`–`1440px`), Category filter, ProjectCard, 4-column Footer, 3-column Docs Reader, hierarchical Sidebar, TOC, dark/light theme toggle, Expressive Code, `CodeTabs`, `Callout`, `PrevNextNav` edit link | `src/pages/*`, `src/layouts/*`, `src/components/*`, `src/styles/global.css` | **ACTUAL WORKING** *(with `AUDIT-F06` `vv` display edge fix queued)* |
| **Search, SEO & AI Endpoints** | Pagefind local index (`Ctrl+K` / `/?q=` deep-link, product vs all scope), `404` `noindex`, Schema.org JSON-LD (`Organization`, `WebSite`, `TechArticle`, `BreadcrumbList`), `sitemap-index.xml`, `robots.txt`, `/llms.txt`, `/llms-full.txt`, `/{slug}/llms.txt`, `/{slug}/{page}.md` | `src/utils/seo.ts`, `src/utils/llms.ts`, `src/utils/search.ts`, `SearchModal.astro`, `astro.config.mjs` | **ACTUAL WORKING** *(`@astrojs/mdx` deprecation warning queued)* |
| **Cloudflare Pages & Functions** | Static output `dist/`, `_headers`, `_redirects`, `_routes.json`, `/api/health`, `/api/webhook` (HMAC-SHA256 / Bearer / GitLab token / branch allowlist) | `wrangler.toml`, `public/_*`, `functions/api/*` | **ACTUAL WORKING** *(`WEBHOOK_SECRET` fail-closed queued)* |
| **Portal Exporter & Presets** | `export-portal --portal user\|dev`, `user-portal` & `dev-portal` presets verified building cleanly end-to-end | `scripts/export-portal.mjs`, `config/presets/*` | **ACTUAL WORKING** *(bare string reminder & `.vibtools` exclusion queued)* |

---

## 2. Per-Phase BugFix / Hardening Updates Added *(Live Log)*

| Phase | Fixes / Features Actually Implemented & Verified | Completion Date | Status |
| :--- | :--- | :--- | :--- |
| **`REL-Phase 01`** | `selectActiveTarget` `portalType: "all"` fix, `formatVersionBadge` `"vv"` guard, `npm test` script, `@astrojs/mdx` deprecation cleanup, new unit tests (`16/16` pass) | `2026-11-18` | **ACTUAL WORKING** |
| **`REL-Phase 02`** | Step 2 `.vibtools` branch switch (`sync-docs.mjs`), clean `YOUR_ORG` metadata & `user-portal` export `.vibtools/` isolation, fail-closed `WEBHOOK_SECRET` guard (`webhook.ts`) | `2026-11-18` | **ACTUAL WORKING** |
| **`REL-Phase 03`** | `Dockerfile` `git` + `openssh-client`, `nginx.conf` `/pagefind/` `must-revalidate` + security/Markdown headers (`charset_types text/markdown text/plain`, single clean `Cache-Control`), `templates/github-notify-docs.yml` `.vibtools/**`, governance docs sync | `2026-11-18` | **ACTUAL WORKING** |

---

## 3. Explicitly Pending / Pre-Production Operator Items

1. **Code/Config BugFixes:**
   - **None pending** — All `REL-Phase 01`–`03` code, infrastructure, template, and documentation items (`AUDIT-F01` through `AUDIT-F09` and `AUDIT-F10.1`) are implemented and verified.
2. **Deferred Upstream / Operator Items (`AUDIT-F10.2` & `AUDIT-F11`):**
   - `postcss-selector-parser <6.1.5` (`@tailwindcss/typography` transitive build-only advisory; no forced breaking downgrade applied).
   - Real repository URLs replacing starter `YOUR_ORG` entries in exported portal `config/projects.json` at live deployment time.

---

> **Bangla Summary (অ্যাকচুয়াল ইমপ্লিমেন্টেশন ম্যাট্রিক্স):** বর্তমান প্রজেক্টে ঠিক কোন কোন ফিচার বাস্তবে কাজ করছে (Verified Working) এবং প্রোডাকশন রিলিজের আগে ঠিক কোন ৯+টি BugFix/Hardening (`REL-Phase 01`–`03`) ও অপারেটর অ্যাকশন বাকি আছে — তার স্পষ্ট রেকর্ড এখানে আলাদাভাবে রাখা হলো।
