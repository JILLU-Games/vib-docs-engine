# 022 — Release Baseline Freeze (`2026-11-18`) & Forensic Audit Report

**Date:** `2026-11-18`
**Status:** Baseline Frozen — Planning Complete (No Implementation Edits Yet)
**Input Forensic Audit:** `notes/021-pre-release-forensic-audit.md`
**Audience:** Operators & Coding Agents (English + Bangla)

---

## 1. Frozen Project Baseline (`vib-docs-engine@0.1.0`)

This document freezes the exact source, build, test, and browser-verified baseline **after** Phases `01`–`08`, `SEO-Phase 01`–`04`, `VT-Phase 01`–`04`, and the zero-edit Pre-Release Forensic Audit (`notes/021-pre-release-forensic-audit.md`).

### Baseline Verification Matrix (Matched Against Live Execution)

| Layer | Verified Baseline State | Authoritative Source / Check |
| :--- | :--- | :--- |
| **TypeScript Checks** | `npm run lint` (`tsc --noEmit`) & `npx tsc -p functions/tsconfig.json --noEmit` both exit `0` | `tsconfig.json`, `functions/tsconfig.json` |
| **Unit Tests** | `14 / 14` pass via `npx tsx --test src/utils/*.test.ts` (`search.test.ts` 4, `seo.test.ts` 4, `vibtoolsConfig.test.ts` 6) | `src/utils/*.test.ts` |
| **Sync & Static Build** | `npm run verify` exits `0`: `Synced vib-docs-engine`, Pagefind indexed `5` pages (`985` words), `7` HTML files, `15` required assets, `1` project, `0` broken internal links | `scripts/sync-docs.mjs`, `scripts/verify-build.mjs` |
| **Dual-Portal Export** | `npm run export-portal -- --portal user` & `--portal dev` both pass `npm run verify` (`12` HTML files, `15` assets, `2` projects, `0` broken links each) | `scripts/export-portal.mjs`, `config/presets/*` |
| **`.vibtools/` System** | `docs.config.json` + `config.docs.json` alias, 2-step sparse checkout, `portalType` (`all`/`users`/`developer`), Smart Markdown metadata fallback, dogfooded `.vibtools/` in engine root | `src/utils/vibtoolsConfig.ts`, `.vibtools/*`, `docs/vibtools-config.md` |
| **Live Browser UI** | `playwright-cli` on `http://localhost:3000`: mobile `390x844` Hub `scrollWidth === 390`, `/?q=vibtools` modal `16` results, `/does-not-exist` `404` + `noindex, follow`, `0` app JS/CSS errors | `src/layouts/*`, `src/components/*`, `src/pages/*` |

> **Bangla Summary (বেসলাইন ফ্রিজ):** `VT-Phase 01`–`04` শেষ হওয়ার পর বর্তমান প্রজেক্টের স্টেট (`vib-docs-engine@0.1.0`) সম্পূর্ণ ফরেনসিক অডিট সহ ফ্রিজ করা হলো। এখন প্রোডাকশন রিলিজের আগে পাওয়া ১১টি অডিট ফাইন্ডিং (`AUDIT-F01`–`AUDIT-F11`) নির্দিষ্ট Phase অনুযায়ী **Scope Lock** করে সমাধান করা হবে।

---

## 2. Matched Forensic Bug, Mismatch & Risk Report

Every item below was directly verified against checked-in source lines and live execution outputs in `notes/021-pre-release-forensic-audit.md`.

| Audit ID | Severity | Exact Source Proof | Verified Bug / Mismatch | Assigned Phase |
| :--- | :--- | :--- | :--- | :--- |
| **`AUDIT-F01`** | **HIGH** *(VPS Blocker)* | `Dockerfile:2, 10-12` vs `scripts/sync-docs.mjs:240-277` | `node:22-alpine` builder lacks `git`; remote `git clone --sparse` throws `spawn git ENOENT` in Docker/VPS builds | **`REL-Phase 03`** |
| **`AUDIT-F02`** | **MEDIUM-HIGH** *(Logic Bug)* | `src/utils/vibtoolsConfig.ts:431-442` | When `portalType === "all"` (`config/site.config.json:8`) and repo defines dual `targets.users` + `targets.developer`, `selectActiveTarget` ignores `registryEntry.docsType` and always picks `targets.users` | **`REL-Phase 01`** |
| **`AUDIT-F03`** | **MEDIUM** *(Test Packaging)* | `package.json:6-19`, `src/utils/*.test.ts` | Missing `"test"` script in `package.json`; native `node --experimental-strip-types --test` exits `1` (`ERR_MODULE_NOT_FOUND`), requiring `tsx --test` | **`REL-Phase 01`** |
| **`AUDIT-F04`** | **MEDIUM** *(Branch Sync Bug)* | `scripts/sync-docs.mjs:279-280, 574, 624-633`, `PrevNextNav.astro:44-49` | `.vibtools/` custom `branch` is copied to `manifest.json` (`Edit this page on Git`), but Step 2 sparse checkout never fetches/switches away from Step 1's `entry.branch` (`main`) | **`REL-Phase 02`** |
| **`AUDIT-F05`** | **MEDIUM** *(Nginx Cache/Security)* | `nginx.conf:25-29` vs `public/_headers:1-11, 27-33` | Nginx sets `Cache-Control: immutable` (1 year) on unhashed `/pagefind/` index files and omits security + `text/markdown; charset=utf-8` headers | **`REL-Phase 03`** |
| **`AUDIT-F06`** | **LOW-MEDIUM** *(UI Display Bug)* | `src/components/hub/ProjectCard.astro:59`, `src/components/docs/Topbar.astro:53` | Unconditional `v{version}` renders `"vv1.0.2"` whenever `.vibtools/` or frontmatter stores `"v1.0.2"` | **`REL-Phase 01`** |
| **`AUDIT-F07`** | **LOW** *(Template Mismatch)* | `templates/github-notify-docs.yml:7-8` vs `docs/adding-projects.md:135` | Trigger `paths:` includes only `"docs/**"` and omits `".vibtools/**"` | **`REL-Phase 03`** |
| **`AUDIT-F08`** | **LOW** *(Exporter Edge Case)* | `scripts/export-portal.mjs:9-20, 185-189`, `scripts/sync-docs.mjs:553-567` | Bare `YOUR_ORG` string entries bypass placeholder reminder in `export-portal.mjs`; `--portal user` export copies root `.vibtools/`; `YOUR_ORG` smoke builds inherit engine `.vibtools/logo.png` | **`REL-Phase 02`** |
| **`AUDIT-F09`** | **LOW** *(Security Hardening)* | `functions/api/webhook.ts:113-141` | When `WEBHOOK_SECRET` is omitted, `POST /api/webhook` allows unauthenticated deploy hook triggers | **`REL-Phase 02`** |
| **`AUDIT-F10`** | **LOW** *(Build Notice / Advisory)* | `astro.config.mjs:187-200`, `npm audit --omit=dev` | (1) `mdx({ remarkPlugins })` prints Astro deprecation warning (`markdown.processor` already sets it). (2) `postcss-selector-parser <6.1.5` build-only advisory via `@tailwindcss/typography` (upstream `--force` would break-downgrade) | **`REL-Phase 01`** *(warning)* / **Deferred** *(npm advisory)* |
| **`AUDIT-F11`** | **INFO** *(Operator Pre-Deploy)* | `config/presets/*/projects.json` | Starter `YOUR_ORG` URLs must be swapped with real repositories before production launch | **Operator Go-Live** |

---

## 3. Strict Phase Scope Locks Summary

To guarantee zero unintended regressions across existing Hub, Docs Reader, SearchModal, ThemeToggle, Pagefind, SEO JSON-LD, or `llms.txt` features:

- **`REL-Phase 01` Scope Lock (Pure Logic, Version Helper, Build Config, Tests):**
  - **Allowed:** `src/utils/vibtoolsConfig.ts`, `src/utils/theme.ts`, `src/utils/vibtoolsConfig.test.ts`, `src/components/hub/ProjectCard.astro` *(version line only)*, `src/components/docs/Topbar.astro` *(version line only)*, `astro.config.mjs` *(remove deprecated duplicate `mdx.remarkPlugins`)*, `package.json` *(`"test"` script only)*.
  - **Locked Out:** All layouts/CSS/globals, `SearchModal.astro`, `Sidebar*`, `scripts/*`, `Dockerfile`, `nginx.conf`, `functions/*`, `config/*`, `docs/*`.
- **`REL-Phase 02` Scope Lock (Sync Script, Exporter, Webhook Fail-Closed):**
  - **Allowed:** `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `functions/api/webhook.ts`.
  - **Locked Out:** All `.astro` / `.css` UI files, `src/utils/*`, `Dockerfile`, `nginx.conf`, `config/*`, `docs/*`.
- **`REL-Phase 03` Scope Lock (Dockerfile, Nginx Headers, Workflow Template, Durable Docs):**
  - **Allowed:** `Dockerfile`, `nginx.conf`, `templates/github-notify-docs.yml`, `docs/adding-projects.md`, `docs/deployment.md`, `docs/vibtools-config.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/*`.
  - **Locked Out:** All `.astro` / `.css` / `src/utils/*` runtime code, `scripts/*`, `functions/*`, `config/*`.
