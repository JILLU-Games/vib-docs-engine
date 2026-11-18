# 025 — Pre-Release Error Handling Inventory & Hardening Plan

**Date:** `2026-11-18`
**Scope:** Verified active error handling in frozen baseline (`vib-docs-engine@0.1.0`) + targeted error & security safeguards planned across `REL-Phase 01`–`03`.

---

## 1. Active Error Handling Verified in Frozen Baseline

| Subsystem | Source Files | Verified Active Safeguards |
| :--- | :--- | :--- |
| **Config Schema & Path Guards** | `src/utils/vibtoolsConfig.ts`, `scripts/sync-docs.mjs` | Zod `siteConfigSchema` (HTTPS `domain`, hex accent, safe `navLinks`), `parseVibtoolsRepoConfig` & `normalizeRegistryEntry` (valid slug regex, hex colors, HTTP(S) `ctaUrl`), `normalizeRelativeRepoPath` + `assertWithin` blocking leading `/`, `\`, `.`, and `..` traversal, symlink rejection (`fs.lstat`), `.vibtools/docs.config.json` vs `config.docs.json` conflict error, embedded-URL credential rejection (`validateRepoUrl`) |
| **Git Sync & Secret Safety** | `scripts/sync-docs.mjs` | Non-interactive Git env (`GIT_TERMINAL_PROMPT=0`, `GIT_ASKPASS=""`), `sanitizeError()` secret token & URL credential redaction, per-project `try/catch` isolation with `contentDirectory` + stale logo rollback on failure, duplicate resolved slug (`reservedSlugs`) error, empty-manifest guard (`syncedProjects.length === 0 && failedCount > 0`), recursive `MANIFEST.md` & `draft: true` cleanup with `typeof data.draft !== "boolean"` check, `README.md` normalization & missing root `index.md` error |
| **Logo & Asset Security** | `scripts/sync-docs.mjs`, `scripts/verify-build.mjs` | `2 MB` size cap, regular-file non-symlink guard, 8-byte PNG signature validation, SVG active-content block (`<script>`, `on*=`, external `href`/`src`), graceful fallback to monogram with warning instead of crash, build-time `dist/` HTML `img[src]` & `link[rel*="icon"]` + `site.webmanifest` existence check |
| **CLI & Exporter** | `scripts/add-project.mjs`, `scripts/export-portal.mjs` | Duplicate `repoUrl` & `slug` block, `--cta-label` requires `--cta-url`, atomic temp-file `.tmp` + `rename` write, `isWithin` recursive export prevention, existing target directory refusal, symlink refusal during `copyEngine` |
| **Search UI & Edge Functions** | `src/components/ui/SearchModal.astro`, `functions/api/webhook.ts`, `functions/api/health.ts` | Same-origin `safeResultUrl`, DOM-safe `<mark>`-only `appendSafeExcerpt`, `?q=` capped at `120` chars, `localStorage` & `history.replaceState` `try/catch`, missing Pagefind fallback text, HMAC-SHA256 `timingSafeEqualString` check & branch allowlist on `/api/webhook`, structured JSON `401`/`405`/`501`/`502` responses |
| **SEO & Static Build Verifier** | `src/utils/seo.ts`, `scripts/verify-build.mjs` | `safeJsonLdStringify` script-tag breakout escaping (`<`, `>`, `&`, `\u2028`, `\u2029`), HTTPS origin fallback (`resolveOrigin`), `404.html` `noindex` enforcement, JSON-LD `JSON.parse()` check on all HTML files, `.md` & `llms.txt` & `_routes.json` & `_redirects` verification |

---

## 2. New Error Handling & Hardening Additions (`REL-Phase 01`–`03`)

| Guard ID | Module | Unhandled Gap in Audit | Planned Safe Behavior | Phase |
| :--- | :--- | :--- | :--- | :--- |
| **`REL-EH-01`** | `src/utils/vibtoolsConfig.ts` | Combined `portalType: "all"` quietly drops `registryEntry.docsType` when a repo defines dual targets, misrouting developer docs into user docs | Explicitly check `registryDocsType` when resolving dual targets under `portalType: "all"` so declared intent matches active target cleanly | **`REL-Phase 01`** |
| **`REL-EH-02`** | `scripts/sync-docs.mjs` | Specifying a different `branch` inside `.vibtools/docs.config.json` vs Step 1 `entry.branch` creates content/edit-URL mismatch without warning or checkout | When `project.branch !== clonedBranch`, run shallow branch fetch + checkout cleanly in sparse temp repo; emit clear project-scoped branch error if remote branch does not exist | **`REL-Phase 02`** |
| **`REL-EH-03`** | `src/utils/theme.ts`, `ProjectCard.astro`, `Topbar.astro` | Version strings prefixed with `"v"` render malformed `"vv1.0.2"` UI badges | Normalize version text via `formatVersionBadge()` stripping leading `v`/`V` cleanly while preserving `"Not specified"` / empty handling | **`REL-Phase 01`** |
| **`REL-EH-04`** | `scripts/export-portal.mjs`, `scripts/sync-docs.mjs` | Exported `user-portal` misses reminder for bare string `YOUR_ORG` entries and leaks engine `.vibtools/` / `.vibtools/logo.png` into starter builds | Inspect both string and object `YOUR_ORG` entries; skip root `.vibtools/` on `--portal user` export and avoid attaching `projectRoot` metadata to `YOUR_ORG` fallback | **`REL-Phase 02`** |
| **`REL-EH-05`** | `functions/api/webhook.ts` | Missing `WEBHOOK_SECRET` silently leaves `POST /api/webhook` open to unauthenticated public callers when `CF_DEPLOY_HOOK_URL` is configured | Fail closed with HTTP `501` (`WEBHOOK_SECRET is not configured`) unless explicit `ALLOW_UNAUTHENTICATED_WEBHOOK === "true"` opt-out is set | **`REL-Phase 02`** |
| **`REL-EH-06`** | `Dockerfile`, `nginx.conf` | Alpine builder omits `git` (`ENOENT` on first remote repo sync); Nginx serves unhashed `/pagefind/` files as `immutable` (1y stale index risk) without `nosniff` | Install `git openssh-client` in `Dockerfile` builder; configure `/pagefind/` `must-revalidate` + security/Markdown headers in `nginx.conf` | **`REL-Phase 03`** |

---

> **Bangla Summary (এরর হ্যান্ডলিং):** প্রজেক্টে বর্তমানে সক্রিয় থাকা সব এরর গার্ড যাচাই করে নোট করা হয়েছে এবং প্রোডাকশন অডিট থেকে পাওয়া ৬টি বাড়তি সেফটি ও এরর হ্যান্ডলিং (`REL-EH-01` – `REL-EH-06`) — যেমন `portalType: "all"` ডুয়াল-টার্গেট প্রোটেকশন, `.vibtools` ব্রাঞ্চ সুইচ/এরর, `"vv"` ভার্সন গার্ড, Webhook fail-closed অথেনটিকেশন এবং Alpine Docker `git` + Nginx cache safety — পরিকল্পিতভাবে নোট করা হলো।
