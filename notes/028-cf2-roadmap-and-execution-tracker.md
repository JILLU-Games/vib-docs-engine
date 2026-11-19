# 028 — Cloudflare Pages Hardening Roadmap & Execution Tracker (`CF2-Phase 01` – `CF2-Phase 03`)

**Date:** `2026-11-18`
**Prerequisite Audit:** `notes/027-cloudflare-pages-forensic-audit.md` (`CF2-F01` – `CF2-F09`)
**Goal:** Resolve all 9 verified Cloudflare Pages & Functions deployment findings across 3 strictly scope-locked phases without altering Astro UI, styling, or `.vibtools/` sync semantics.

---

## 1. Phase Progress Summary

- **Total Planned Phases:** `4` (`CF2-Phase 01` – `CF2-Phase 04`)
- **Completed Phases:** `4 / 4` (`CF2-Phase 01`, `CF2-Phase 02`, `CF2-Phase 03`, `CF2-Phase 04`)
- **Remaining Phases:** `0 / 4` (`All Planned Cloudflare Hardening Phases Completed`)
- **Next Approved Target:** `None — 100% Cloudflare Pages & GitHub Build Hygiene Ready`

| Phase | Target Objective | Audit IDs | Status | Strictly Locked Files | Scope Lock Violated? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`CF2-Phase 01`** | Pages Functions Runtime Hardening (`HEAD /api/health`, `ping` skip, form-urlencoded branch parse, deploy-hook HTTPS/timeout/body cleanup) | `CF2-F01`, `CF2-F02`, `CF2-F03`, `CF2-F04` | **COMPLETED (Verified 2026-11-18)** | `functions/api/health.ts`, `functions/api/webhook.ts` | **No** |
| **`CF2-Phase 02`** | Build Determinism, Wrangler Project Naming, Lockfile Hygiene, `_headers` & Per-Portal Webmanifest Parity | `CF2-F06`, `CF2-F07`, `CF2-F08` | **COMPLETED (Verified 2026-11-18)** | `wrangler.toml`, `package.json`, `scripts/run-astro.mjs`, `scripts/export-portal.mjs`, `public/_headers`, `scripts/MANIFEST.md` | **No** |
| **`CF2-Phase 03`** | Prevent `dist/MANIFEST.md` & `dist/README.md` Public Leak, CI Strict `YOUR_ORG` Guard & Deployment Docs Sync | `CF2-F05`, `CF2-F09` | **COMPLETED (Verified 2026-11-18)** | `astro.config.mjs`, `scripts/sync-docs.mjs`, `scripts/verify-build.mjs`, `docs/deployment.md`, `project/*`, `notes/*` | **No** |
| **`CF2-Phase 04`** | Official Node `22.23.5` Pin, Root `bun.lock` Removal, Clean Registry `package-lock.json`, `.aistudio` & `public/assets/aistudio` Leak Guard | `CF2-F10`, `CF2-F11`, `CF2-F12`, `CF2-F13` | **COMPLETED (Verified 2026-11-18)** | `.node-version`, `.nvmrc`, `bun.lock` (deleted), `package-lock.json`, `.gitignore`, `.dockerignore`, `MANIFEST.md`, `astro.config.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, `docs/deployment.md`, `project/*`, `notes/*` | **No** |

---

## 2. Phase Execution Logs

### `CF2-Phase 01` — Pages Functions Runtime Hardening *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Updates:**
  1. `functions/api/health.ts`: Exported `onRequestHead()` (`200`, null body, `Cache-Control: no-store`) and updated `onRequest()` (`Allow: GET, HEAD`) so `HEAD` uptime probes succeed instead of hitting `405` (`CF2-F01`).
  2. `functions/api/webhook.ts`:
     - Added `isAllowedDeployHookUrl()` validating `https://` (or loopback `localhost`/`127.0.0.1` for local dev), returning HTTP `501` if invalid (`CF2-F04`).
     - Added `isPingWebhookEvent()` after authentication to skip `ping` events (`x-github-event`, `x-gitea-event`, `x-forgejo-event`) with HTTP `200` (`reason: "ping_event"`) (`CF2-F02`).
     - Extended `parseBranchFromPayload(rawBody, contentType)` to unwrap `payload=...` from `application/x-www-form-urlencoded` payloads so `ALLOWED_BRANCHES` cannot be bypassed (`CF2-F03`).
     - Added `AbortController` `10_000ms` timeout and `await hookResponse.body?.cancel().catch(() => {})` stream cleanup (`CF2-F04`).
- **Files Modified:** `functions/api/health.ts`, `functions/api/webhook.ts` (plus `notes/028`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` logs).
- **Scope Check:** Zero changes to `.astro`, CSS, `src/utils/*`, `scripts/*`, `public/*`, `package.json`, `wrangler.toml`, or `docs/*`.
- **Verification Output:** `npx tsc -p functions/tsconfig.json --noEmit`, `npm test` (`16/16` pass), `npm run lint` (`tsc --noEmit`), and handler runtime suite (`CF2_PHASE01_FUNCTIONS_PROOF: PASS` covering `HEAD /api/health`, `501` bad URL/missing secret, `401` unauthenticated ping, `200` ping skip, `200` form-urlencoded `branch_ignored`, `202` form-urlencoded `main` + `body.cancel()`, `405` fallback), plus `compile_applet` and `lint_applet`.

---

### `CF2-Phase 02` — Build Determinism, Wrangler Project Naming, Lockfile Hygiene & `_headers` Parity *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Updates:**
  1. Added `scripts/run-astro.mjs` (`CF2-F06`): runs Astro natively on Node `>=22.23.4` (including Cloudflare Pages `.node-version` `22.23.5`) and applies `--import data:text/javascript,process.versions.webcontainer='1'` strictly for Node `22.22.0`–`22.23.3` containers. Updated `package.json` `dev`/`build`/`preview` scripts to invoke `node scripts/run-astro.mjs` and aligned `engines.node` to `">=22.23.4"`.
  2. Updated `wrangler.toml` comments to reflect fail-closed `WEBHOOK_SECRET` + `ALLOW_UNAUTHENTICATED_WEBHOOK` behavior accurately (`CF2-F07`).
  3. Updated `scripts/export-portal.mjs` (`CF2-F06`, `CF2-F07`, `CF2-F08`): omits `bun.lock`/`bun.lockb` so Cloudflare Pages Build v2 deterministically uses `npm ci` + `package-lock.json`, customizes `wrangler.toml` `name` (`"docs-vib-tools"` vs `"developer-vibtools-io"`), and updates exported `public/site.webmanifest` (`name`, `short_name`, `theme_color`) from the chosen portal preset.
  4. Updated `public/_headers` (`CF2-F08`) with `/*.md` coverage at arbitrary nesting depths and explicit `/site.webmanifest` `Content-Type: application/manifest+json; charset=utf-8` rule.
- **Files Modified:** `scripts/run-astro.mjs`, `scripts/MANIFEST.md`, `package.json`, `wrangler.toml`, `scripts/export-portal.mjs`, `public/_headers` (plus `notes/028`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`).
- **Scope Check:** Zero changes to `.astro`, CSS, `src/utils/*`, `functions/api/*`, `scripts/sync-docs.mjs`, `scripts/verify-build.mjs`, or `docs/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify` (`7` HTML files, `15` required assets, `5` Pagefind pages, `0` broken links), `CF2_PHASE02_EXPORT_PROOF: PASS` (`user-portal` & `dev-portal` exports verified for missing `bun.lock`, distinct `wrangler.toml` names, customized `site.webmanifest`, and updated `dist/_headers`), `compile_applet`, and `lint_applet`.

---

### `CF2-Phase 03` — Prevent `dist/MANIFEST.md` & `dist/README.md` Public Leak, CI Strict `YOUR_ORG` Guard & Deployment Docs Sync *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Updates:**
  1. Added `vib-prune-public-governance-docs` integration (`astro:build:done` hook) in `astro.config.mjs` to remove `dist/MANIFEST.md` and `dist/README.md` after static output generation while keeping `public/MANIFEST.md` and `public/README.md` intact in the repository (`CF2-F05`).
  2. Added `CF_PAGES=1` / `STRICT_SYNC=1` / `--strict` fail-closed guard on `YOUR_ORG` placeholder repository URLs in `scripts/sync-docs.mjs` and `scripts/verify-build.mjs` (`CF2-F09`) while retaining the local `./docs` fixture fallback for local developer smoke builds.
  3. Added `dist/MANIFEST.md` and `dist/README.md` leak assertion in `scripts/verify-build.mjs` (`CF2-F05`).
  4. Synchronized `docs/deployment.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/027`, and `notes/028`.
- **Files Modified:** `astro.config.mjs`, `scripts/sync-docs.mjs`, `scripts/verify-build.mjs`, `docs/deployment.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/027-cloudflare-pages-forensic-audit.md`, `notes/028-cf2-roadmap-and-execution-tracker.md`.
- **Scope Check:** Zero changes to `.astro` UI/components, CSS, `src/utils/*`, `functions/api/*`, or `config/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify` (`7` HTML files, `15` assets, `5` Pagefind pages, `1028` words, `0` broken links), `CF2_PHASE03_PROOF: PASS` (`public/MANIFEST.md` & `public/README.md` present in repo, absent in `dist/`; `user-portal` local smoke sync exits `0` while `CF_PAGES=1` sync fails closed on `YOUR_ORG`), `compile_applet`, and `lint_applet`.

---

### `CF2-Phase 04` — Official Node `22.23.5` Pin, Root `bun.lock` Removal, Registry `package-lock.json` & Workspace Artifact Hygiene *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Updates:**
  1. Updated `.node-version` and `.nvmrc` from `22.24.0` (unpublished on `nodejs.org/dist/`, HTTP `404`) to official `22.23.5` (HTTP `200`, satisfying Astro 7's `>=22.23.4` requirement) (`CF2-F10`).
  2. Deleted conflicting root `/bun.lock` and added `bun.lock` / `bun.lockb` to `.gitignore` and `.dockerignore` (`CF2-F11`).
  3. Regenerated `/package-lock.json` cleanly from the npm registry (`511` total packages, `505` with `resolved` + `integrity` hashes, `156` cross-platform optional binaries, `engines.node: ">=22.23.4"`) (`CF2-F12`).
  4. Deleted `/public/assets/aistudio` screenshots (`Screenshot_1_cdbfd185.png`, `Screenshot_2_382ee993.png`, `Screenshot_5_a9fc5312.png`), ignored `.aistudio/` and `public/assets/aistudio/` in `.gitignore`, `.dockerignore`, and `scripts/export-portal.mjs`, extended `astro.config.mjs` post-build pruning to remove `dist/assets/aistudio`, and added automated assertions in `scripts/verify-build.mjs` (`CF2-F13`).
  5. Updated `config/site.config.json` `navLinks` GitHub URL from `https://github.com/vibtools` to `https://github.com/vibtoolshq` to match the live organization account.
- **Files Modified:** `.node-version`, `.nvmrc`, `bun.lock` (deleted), `public/assets/` (deleted), `package-lock.json`, `.gitignore`, `.dockerignore`, `MANIFEST.md`, `astro.config.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, `config/site.config.json`, `docs/deployment.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/027-cloudflare-pages-forensic-audit.md`, `notes/028-cf2-roadmap-and-execution-tracker.md`.
- **Scope Check:** Zero changes to `.astro` UI/components, CSS, `src/utils/*`, or `functions/api/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify` (`7` HTML files, `15` assets, `5` Pagefind pages, `0` broken links), `CF2_PHASE04_PROOF: PASS`, `compile_applet`, and `lint_applet`.


