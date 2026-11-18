# 018 — `.vibtools/` Workstream Actual Implementation Matrix

**Last Baseline Verified:** `2026-11-18`
**Rule:** Mark an item **ACTUAL WORKING** only after its code is written, compiled (`compile_applet` + `tsc --noEmit`), unit-tested (`npx --yes tsx --test`), and build-verified (`npm run verify`).

---

## 1. Actual Working Baseline Features (`2026-11-18`)

| Domain | Verified Working Feature | Authoritative Source | Status |
| :--- | :--- | :--- | :--- |
| **Git Sparse Sync** | Single-phase `docsPath` sparse clone, `GIT_TOKEN` / per-project `secretKey`, local self-fallback (`vib-docs-engine`), `MANIFEST.md`/`draft: true` strip, `README.md` -> `index.md` | `scripts/sync-docs.mjs` | **ACTUAL WORKING** |
| **SEO & AI Search (`SEO-Phase 01`–`04`)** | `404` `noindex`, `og:type="article"`, Schema.org JSON-LD (`Organization`, `WebSite`+`SearchAction`, `TechArticle`, `BreadcrumbList`), `/llms.txt`, `/llms-full.txt`, `/{product}/{slug}.md`, `robots.txt`, `?q=` search | `src/utils/seo.ts`, `src/utils/llms.ts`, `src/layouts/*`, `src/pages/*`, `SearchModal.astro` | **ACTUAL WORKING** |
| **Brand Logos & Favicons** | Persistent `public/vib-tools-logo.png`, `docs/logo.png` -> `/logos/vib-docs-engine.png`, `.ico`/`.png`/Apple Touch icons, `site.webmanifest`, `og-default.png` | `public/*`, `docs/logo.png`, `src/layouts/BaseLayout.astro`, `config/site.config.json` | **ACTUAL WORKING** |
| **Hub, Docs UI & Cloudflare** | Split Hero + `Quick Guides`, `ProjectCard`, 4-column Footer, 3-column Docs Reader, Pagefind `Ctrl+K` modal, Cloudflare Functions (`/api/health`, `/api/webhook`) | `src/pages/index.astro`, `src/layouts/*`, `src/components/*`, `functions/api/*` | **ACTUAL WORKING** |

---

## 2. Newly Added Features Per `.vibtools/` Update Phase *(Live Log)*

| Phase | Features Actually Implemented & Verified | Completion Date |
| :--- | :--- | :--- |
| **VT-Phase 01** | Pure `.vibtools/` config parser/validator (`docs.config.json` & `config.docs.json` contract), dual-target (`users` / `developer`) resolver, bare `repoUrl` registry normalizer, traversal/slug guards, Smart Markdown fallback (`title`, 1st-paragraph `description`, `vX.Y.Z`), `portalType` (`all` / `users` / `developer`) in `SiteConfig` & presets + `6/6` `node:test` unit tests | `2026-11-18` |
| **VT-Phase 02** | 2-step `.vibtools` Git sparse checkout (`scripts/sync-docs.mjs`), `docs.config.json` & `config.docs.json` auto-discovery (with conflict guard), bare `repoUrl` entries in `projects.json`, `portalType` auto-filtering, `.vibtools/logo.*` & custom `logoPath` resolution, duplicate resolved slug protection, and Smart Markdown metadata fallback | `2026-11-18` |
| **VT-Phase 03** | `.vibtools/docs.config.json` + `.vibtools/logo.png` in `vib-docs-engine` root, `--url` `.vibtools/` zero-config & interactive Auto/Manual CLI modes + `VT-EH-08` duplicate `repoUrl`/slug guard in `scripts/add-project.mjs`, root `.vibtools/` & registry validation in `scripts/verify-build.mjs`, and compact `.vibtools/` `user-portal` / `dev-portal` presets | `2026-11-18` |
| **VT-Phase 04** | Live `Vib Docs Engine` guide & Draft 2020-12 JSON Schema in `docs/vibtools-config.md`, updated `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`, synced `MANIFEST.md` & `project/*` governance, plus verified static `.md` / `llms-full.txt` & Chromium render (`0` errors) | `2026-11-18` |

---

## 3. Not-Yet-Implemented / Pending Features (Explicitly Unimplemented Today)

- *(None — all 4 planned `.vibtools/` workstream phases are implemented, tested, and build-verified as of `2026-11-18`.)*

---

> **Bangla Summary (অ্যাকচুয়াল ইমপ্লিমেন্টেশন ম্যাট্রিক্স):** `.vibtools/` ওয়ার্কার্স্ট্রিমের সবকটি ধাপ (`VT-Phase 01` – `VT-Phase 04`) এখন সোর্স, টেস্ট, বিল্ড ও লাইভ ব্রাউজার চেক সহ **ACTUAL WORKING** অবস্থায় আছে।
