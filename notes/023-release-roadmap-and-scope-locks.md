# 023 — Pre-Release BugFix Roadmap & Scope Locks (`REL-Phase 01` – `REL-Phase 03`)

**Date:** `2026-11-18`
**Prerequisite Baseline:** `notes/022-release-baseline-and-forensic-report.md`
**Goal:** Resolve all actionable pre-release bugs, caching/header mismatches, build warnings, test-script gaps, and Docker/webhook edge cases across **3 strictly scope-locked phases** without altering unrelated UI, layout, SEO, or routing behavior.

---

## 1. Phase Roadmap Matrix

| Phase | Target Objective | Audit IDs | Strictly Locked Files | Untouched Guarantees |
| :--- | :--- | :--- | :--- | :--- |
| **`REL-Phase 01`** | Fix `portalType: "all"` Dual-Target Resolver, `vv` Version Badge Bug, `npm test` Script, & `@astrojs/mdx` Warning | `AUDIT-F02`, `AUDIT-F03`, `AUDIT-F06`, `AUDIT-F10.1` | `src/utils/vibtoolsConfig.ts`, `src/utils/theme.ts`, `src/utils/vibtoolsConfig.test.ts`, `src/components/hub/ProjectCard.astro`, `src/components/docs/Topbar.astro`, `astro.config.mjs`, `package.json` | CSS/layout/spacing untouched; `scripts/*`, `Dockerfile`, `nginx.conf`, `functions/*`, `docs/*` untouched |
| **`REL-Phase 02`** | Support `.vibtools` Branch Switch During Sparse Sync, Fix `export-portal` Placeholder/Config Handling & Webhook Auth Fail-Closed | `AUDIT-F04`, `AUDIT-F08`, `AUDIT-F09` | `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `functions/api/webhook.ts` | All `.astro`/`.css` UI untouched; `src/utils/*`, `Dockerfile`, `nginx.conf`, `config/*`, `docs/*` untouched |
| **`REL-Phase 03`** | Add `git` to `Dockerfile`, Fix Nginx `/pagefind/` Caching & Security Headers, Add `.vibtools/**` to GitHub Template & Sync Docs | `AUDIT-F01`, `AUDIT-F05`, `AUDIT-F07` | `Dockerfile`, `nginx.conf`, `templates/github-notify-docs.yml`, `docs/adding-projects.md`, `docs/deployment.md`, `docs/vibtools-config.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` | All Astro app runtime, CSS, `src/utils/*`, `scripts/*`, `functions/*`, `config/*` untouched |

---

## 2. Exact Per-Phase Patch Blueprints & Acceptance Checks

### `REL-Phase 01` — Pure Resolver Fix, Version Badge Normalization, Test Script & MDX Config Cleanup
- **Why First:** Fixes pure TypeScript resolver bugs and local build/test tooling first so every later phase runs `npm test` + clean zero-warning `astro build` automatically.
- **Exact Edits:**
  1. `src/utils/vibtoolsConfig.ts` (`selectActiveTarget`, `lines 430-442`):
     - When `portalType === "all"` and `targets` exists with both `users` and `developer`:
       - If `registryDocsType === "developer"` and `targets.developer` exists -> return `{ matched: true, targetConfig: targets.developer, effectiveDocsType: "developer" }`.
       - If `registryDocsType === "users"` and `targets.users` exists -> return `{ matched: true, targetConfig: targets.users, effectiveDocsType: "users" }`.
       - Otherwise keep fallback `targets.users ?? targets.developer`.
  2. `src/utils/theme.ts`:
     - Export `formatVersionBadge(version?: string | number | null): string` which trims and strips optional leading `v`/`V` (`replace(/^v+/i, "")`) and returns `""` if empty, otherwise `v${cleaned}`.
  3. `src/components/hub/ProjectCard.astro` (`line 59`) & `src/components/docs/Topbar.astro` (`line 53`):
     - Render `{formatVersionBadge(version)}` / `{formatVersionBadge(product.version)}` so `"v1.0.2"` and `"1.0.2"` both display `"v1.0.2"` (zero `"vv1.0.2"`). Only the version badge expression changes; surrounding classes/HTML stay untouched.
  4. `astro.config.mjs` (`lines 187-190`):
     - Change `mdx({ remarkPlugins: sharedRemarkPlugins })` -> `mdx()` because `markdown.processor` (`lines 198-200`) already configures `unified({ remarkPlugins: sharedRemarkPlugins })` and MDX inherits it cleanly without deprecation warnings.
  5. `package.json` (`scripts`):
     - Add `"test": "npx --yes tsx --test src/utils/*.test.ts"`.
  6. `src/utils/vibtoolsConfig.test.ts`:
     - Add assertions for `portalType: "all"` selecting `targets.developer` when `registryEntry.docsType === "developer"`, and unit tests for `formatVersionBadge("v1.0.2") === "v1.0.2"` & `formatVersionBadge("1.0.2") === "v1.0.2"`.
- **Verification Gate:** `npm test`, `npm run lint`, `npm run verify` (confirm zero `[@astrojs/mdx]` deprecation warning and verify MDX/MD internal links still rewrite), plus targeted Chromium screenshot/DOM check of Hub & Topbar version badge.

---

### `REL-Phase 02` — Sync Branch Resolution, Exporter Safety & Webhook Fail-Closed Guard
- **Why Second:** Fixes Git sync edge cases, split-portal exporter hygiene, and Cloudflare Function webhook authorization cleanly while keeping UI completely frozen.
- **Exact Edits:**
  1. `scripts/sync-docs.mjs`:
     - Track `clonedBranch = entry.branch || "main"` inside `cloneMetadataFirst` / caller (`lines 279-280, 574`).
     - In Step 2 (`lines 624-633`), if `project.branch !== clonedBranch`, run `switchGitSparseBranch(repoRootForMetadata, project.branch)` (`git fetch --depth 1 origin <branch>` + `git checkout -B <branch> FETCH_HEAD`) *before* `addGitSparsePaths` so docs content matches the branch used by `PrevNextNav.astro`! Fail with a clear project-scoped error if remote branch does not exist (`REL-EH-02`).
     - In `YOUR_ORG` starter fallback (`lines 553-567`), do **not** attach `repoRootForMetadata = projectRoot` so placeholder fixtures don't inherit `vib-docs-engine`'s `.vibtools/logo.png`; let them fall back cleanly to docs/monogram or `docs/logo.png` cleanly.
  2. `scripts/export-portal.mjs`:
     - Update `shouldSkip(relativePath)` (`lines 60-84`) so when `options.portal === "user"` (or generally when exporting a standalone portal repo), the engine's root `.vibtools/` folder is omitted (`segments[0] === ".vibtools"`) rather than shipping `vib-docs-engine`'s developer descriptor inside `user-portal`.
     - Update `YOUR_ORG` reminder check (`lines 184-194`) to inspect both bare strings and `project?.repoUrl`.
  3. `functions/api/webhook.ts` (`lines 113-141`):
     - Extend `WebhookEnv` with optional `ALLOW_UNAUTHENTICATED_WEBHOOK?: string`.
     - If `!configuredSecret && env.ALLOW_UNAUTHENTICATED_WEBHOOK !== "true"`, return HTTP `501` JSON `{ ok: false, error: "WEBHOOK_SECRET is not configured in Cloudflare Pages environment variables." }` with `Cache-Control: no-store` instead of letting unauthenticated callers trigger deploys.
- **Verification Gate:** `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm test`, real local bare-git two-branch test (`main` + `docs-v2` `.vibtools` branch switch check), `export-portal --portal user` & `--portal dev` + `npm run verify`, and static check of `webhook.ts` error branch.

---

### `REL-Phase 03` — Dockerfile `git`, Nginx Headers/Cache Parity, GitHub Template & Governance Sync
- **Why Last:** Hardens production deployment artifacts (`Dockerfile`, `nginx.conf`, CI template) and synchronizes durable operator documentation (`docs/`, `project/`, `notes/`).
- **Exact Edits:**
  1. `Dockerfile` (`builder` stage before `RUN npm ci` or `npm run build`):
     - Add `RUN apk add --no-cache git openssh-client` so remote HTTPS/SSH sparse checkouts succeed inside Alpine Docker builds.
  2. `nginx.conf`:
     - Add global security headers (`X-Content-Type-Options "nosniff"`, `X-Frame-Options "SAMEORIGIN"`, `Referrer-Policy "strict-origin-when-cross-origin"`) matching `public/_headers`.
     - Update `/pagefind/` cache block from `expires 1y; Cache-Control "...immutable"` to `expires 1h; add_header Cache-Control "public, max-age=3600, must-revalidate";`.
     - Add `llms.txt` / `.md` `charset=utf-8` / `text/markdown` content-type + `max-age=300` rules aligned with `public/_headers`.
  3. `templates/github-notify-docs.yml` (`lines 7-8`):
     - Add `- ".vibtools/**"` under `on.push.paths`.
  4. Durable Docs & Governance Sync:
     - Update `docs/deployment.md`, `docs/adding-projects.md`, `docs/vibtools-config.md` (`WEBHOOK_SECRET` fail-closed requirement, `npm test`, `branch` rules).
     - Update `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/024`–`026`.
- **Verification Gate:** `npm test`, `npm run lint`, `npx tsc -p functions/tsconfig.json --noEmit`, `npm run verify`, `dockerfile` / `nginx.conf` syntax inspection (plus `nginx -t` / `docker` check if binary present, or documented clearly if container daemon unavailable), and final Chromium verification.
