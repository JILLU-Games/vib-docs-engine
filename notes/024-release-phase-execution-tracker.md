# 024 — Release Phase Execution Tracker & Completion Log

**Purpose:** Live phase-by-phase tracker for `REL-Phase 01` through `REL-Phase 03`. Update immediately after finishing each phase so completed work, remaining phases, next actions, and strict scope-lock adherence are never lost or mixed up.

---

## 1. Current Progress Summary

- **Baseline Frozen:** `2026-11-18` (`vib-docs-engine@0.1.0`, post `VT-Phase 04` + Forensic Audit `021`)
- **Total Planned Release Phases:** `3` (`REL-Phase 01` – `REL-Phase 03`)
- **Completed Phases:** `3 / 3` (`REL-Phase 01`, `REL-Phase 02`, `REL-Phase 03`)
- **Remaining Phases:** `0 / 3` (`All Planned Pre-Release Phases Completed`)
- **Next Approved Target:** `None — Ready for Final Release Cutover`

| Phase | Title | Audit IDs | Status | Completed? | Strictly Locked Files | Scope Lock Violated? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`REL-Phase 01`** | Dual-Target `all` Resolver, `vv` Version Badge Fix, `npm test` Script & MDX Warning Cleanup | `AUDIT-F02`, `AUDIT-F03`, `AUDIT-F06`, `AUDIT-F10.1` | **COMPLETED (Verified 2026-11-18)** | `Yes` | `src/utils/vibtoolsConfig.ts`, `src/utils/theme.ts`, `src/utils/vibtoolsConfig.test.ts`, `ProjectCard.astro`, `Topbar.astro`, `astro.config.mjs`, `package.json` | **No** |
| **`REL-Phase 02`** | Sparse Sync Branch Switch, Exporter `.vibtools/` & Placeholder Fix, Webhook Fail-Closed Auth | `AUDIT-F04`, `AUDIT-F08`, `AUDIT-F09` | **COMPLETED (Verified 2026-11-18)** | `Yes` | `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `functions/api/webhook.ts` | **No** |
| **`REL-Phase 03`** | `Dockerfile` Git Binary, Nginx Cache/Security Alignment, Workflow Template & Durable Docs Sync | `AUDIT-F01`, `AUDIT-F05`, `AUDIT-F07` | **COMPLETED (Verified 2026-11-18)** | `Yes` | `Dockerfile`, `nginx.conf`, `templates/github-notify-docs.yml`, `docs/*`, `project/*`, `notes/*` | **No** |

---

## 2. Phase Execution Log Slots

### `REL-Phase 01` — Execution Log *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Features / BugFixes:**
  - Updated `selectActiveTarget` (`src/utils/vibtoolsConfig.ts`) so combined `portalType: "all"` portals honor explicit `registryEntry.docsType` (`"developer"` / `"users"`) when a `.vibtools` repository defines both `targets.users` and `targets.developer`.
  - Added `formatVersionBadge()` (`src/utils/theme.ts`) stripping optional leading `v`/`V` before prepending single `"v"`, and wired it into `src/components/hub/ProjectCard.astro` and `src/components/docs/Topbar.astro` so `"v1.0.2"` never renders `"vv1.0.2"`.
  - Added `"test": "npx --yes tsx --test src/utils/*.test.ts"` to `package.json`.
  - Replaced `mdx({ remarkPlugins: sharedRemarkPlugins })` with `mdx()` in `astro.config.mjs` (inheriting `markdown.processor` cleanly without the Astro deprecation warning).
  - Added 2 new `node:test` suites in `src/utils/vibtoolsConfig.test.ts` (`16/16` total tests passing).
- **Files Modified:** `src/utils/vibtoolsConfig.ts`, `src/utils/theme.ts`, `src/utils/vibtoolsConfig.test.ts`, `src/components/hub/ProjectCard.astro`, `src/components/docs/Topbar.astro`, `astro.config.mjs`, `package.json` (plus `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/024`, `notes/026` governance logs).
- **Scope Check:** Zero changes to CSS tokens/styles/layouts, `scripts/*`, `Dockerfile`, `nginx.conf`, `functions/*`, `config/*`, or `docs/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint` (`tsc --noEmit`), `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify` (`7` HTML files, `15` assets, `5` Pagefind pages, `0` broken links, zero `@astrojs/mdx` deprecation warning), `compile_applet` + `lint_applet`, and Chromium live inspection on `/` (`hubBadge: "v0.1.0"`) and `/vib-docs-engine/` (`topbarBadge: "v0.1.0"`, `Errors: 0, Warnings: 0`) passed.

---

### `REL-Phase 02` — Execution Log *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Features / BugFixes:**
  - Added `switchGitSparseBranch()` (`scripts/sync-docs.mjs`) so when Step 1 clones `entry.branch || "main"` and `.vibtools/` resolves a different `project.branch`, Step 2 runs shallow `git fetch --depth 1 origin <branch>` + `git checkout -B <branch> FETCH_HEAD` before `addGitSparsePaths` with sanitized secret redaction (`AUDIT-F04`, `REL-EH-02`).
  - Removed `repoRootForMetadata = projectRoot` from `YOUR_ORG` starter fixture fallback in `scripts/sync-docs.mjs` so starter builds do not inherit engine `.vibtools/logo.png`.
  - Updated `scripts/export-portal.mjs` (`shouldSkip`, `copyEngine`, `main`) to omit engine root `.vibtools/` on `--portal user` exports and detect both bare string and `.repoUrl` object `YOUR_ORG` placeholders (`AUDIT-F08`, `REL-EH-04`).
  - Updated `functions/api/webhook.ts` (`WebhookEnv`, `onRequestPost`) so missing `WEBHOOK_SECRET` fails closed with HTTP `501` unless `ALLOW_UNAUTHENTICATED_WEBHOOK="true"` is explicitly configured (`AUDIT-F09`, `REL-EH-05`).
- **Files Modified:** `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `functions/api/webhook.ts` (plus `notes/024`, `notes/026`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` logs).
- **Scope Check:** Zero changes to Astro UI/components/pages, CSS, `src/utils/*`, `Dockerfile`, `nginx.conf`, `config/*`, or `docs/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, multi-branch bare-Git sparse checkout (`main` `.vibtools` -> `docs-v2` `docs/guide/index.md` checked out cleanly, `src/secret.ts` absent), `webhook.ts` handler test (`501` fail-closed / `401` bad secret / `202` opt-out / `202` valid secret), `export-portal --portal user` & `--portal dev` + `npm run sync` (`2` projects each, `.vibtools` omitted on `user-portal`), `npm run verify` (`7` HTML files, `15` required assets, `5` Pagefind pages, `0` broken links), `compile_applet`, and `lint_applet` passed.

---

### `REL-Phase 03` — Execution Log *(Verified `2026-11-18`)*
- **Status:** `COMPLETED`
- **Implemented Features / BugFixes:**
  - Added `RUN apk add --no-cache git openssh-client` in `Dockerfile` builder stage (`AUDIT-F01`, `REL-EH-06`) so Alpine Docker builds support remote HTTPS/SSH sparse-checkout sync.
  - Updated `nginx.conf` (`AUDIT-F05`, `REL-EH-06`): switched `/pagefind/` from `immutable` (`1y`) to `public, max-age=3600, must-revalidate`, added global + per-location security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`), removed redundant `expires` directives that caused duplicate `Cache-Control` headers, and added `charset_types text/markdown text/plain` so `.md` serves `text/markdown; charset=utf-8` (`max-age=300`) and `llms.txt`/`robots.txt` serve `text/plain; charset=utf-8` matching `public/_headers`.
  - Added `- ".vibtools/**"` to `templates/github-notify-docs.yml` (`AUDIT-F07`).
  - Synchronized `docs/deployment.md`, `docs/adding-projects.md`, `docs/vibtools-config.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, and `notes/024`–`026`.
- **Files Modified:** `Dockerfile`, `nginx.conf`, `templates/github-notify-docs.yml`, `docs/deployment.md`, `docs/adding-projects.md`, `docs/vibtools-config.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/024-release-phase-execution-tracker.md`, `notes/026-release-actual-implementation-matrix.md`.
- **Scope Check:** Zero changes to Astro UI/components/pages, CSS, `src/utils/*`, `scripts/*`, `functions/*`, or `config/*`.
- **Verification Output:** `npm test` (`16/16` pass), `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify` (`7` HTML files, `15` assets, `5` Pagefind pages, `1006` words, `0` broken links), live `nginx` `-t` + HTTP header verification (`NGINX_SYNTAX: PASS` & `NGINX_LIVE_HEADERS: PASS` — single clean `Cache-Control`, `must-revalidate` on `/pagefind/`, `text/markdown; charset=utf-8` on `.md`, security headers on all routes; `docker` CLI not present in container), live Chromium verification on `/` (`v0.1.0`) and `/vib-docs-engine/deployment/` (`Errors: 0, Warnings: 0`), `compile_applet`, and `lint_applet` passed.

---

## 3. Deferred / Non-Code Pre-Deploy Items (Tracked Separately)

- **`AUDIT-F10.2` (`npm audit --omit=dev`):** `postcss-selector-parser <6.1.5` build-time advisory via `@tailwindcss/typography` (do not run `--force` downgrade; track upstream/override cleanly).
- **`AUDIT-F11` (Go-Live Operator Action):** Replace `YOUR_ORG` placeholder URLs in exported portal `config/projects.json` before production launch.
