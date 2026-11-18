# 021 — Pre-Release Full Forensic Audit (Zero-Edit Inspection)

- **Audit Date:** 2026-11-18
- **Target State:** Post `VT-Phase 04` (`vib-docs-engine@0.1.0`)
- **Audit Mode:** Read-only forensic inspection + live build/test/CLI/browser proof collection (**no application runtime or configuration files modified during this audit**).

---

## 1. Verified Passing Baseline (Confirmed in Current Environment)

| Verification Gate | Exact Command / Check | Verified Result |
| --- | --- | --- |
| TypeScript (App & Utils) | `npm run lint` (`tsc --noEmit`) | Exit `0` |
| TypeScript (Cloudflare Functions) | `npx tsc -p functions/tsconfig.json --noEmit` | Exit `0` |
| Unit Tests (via `tsx`) | `npx tsx --test src/utils/*.test.ts` | `14/14` pass (`search.test.ts` 4, `seo.test.ts` 4, `vibtoolsConfig.test.ts` 6) |
| Full Sync + Build + Pagefind + Verify | `npm run verify` | Exit `0` — synced `vib-docs-engine`, indexed `5` pages (`985` words), verified `7` HTML files, `15` required assets, `1` project, `0` broken links |
| Exported Portals (`user` & `dev`) | `npm run export-portal -- --portal <user\|dev>` + `npm run verify` | Both portals passed: `12` HTML files, `15` required assets, `2` projects, `0` broken links each |
| Live Chromium Check (`localhost:3000`) | Hub (`390x844` mobile + `1440x900` desktop), `/?q=vibtools`, `/does-not-exist` | Mobile `overflowX: false` (`390 === 390`), `/?q=vibtools` opens modal with `16` results, `/does-not-exist` serves `404` with `noindex, follow`, `0` app JS/CSS errors |

---

## 2. Verified Findings Inventory (Bugs, Mismatches, Gaps & Operational Risks)

### `AUDIT-F01` — HIGH (Docker/VPS Blocker): `Dockerfile` builder image (`node:22-alpine`) lacks `git`

- **Location:** `Dockerfile:2, 10-12` -> calls `npm run build` -> `package.json:14-15` (`prebuild`: `node scripts/sync-docs.mjs`) -> `scripts/sync-docs.mjs:240-277` (`execFileSync("git", ...)`)
- **Proof (Exact Code):**
  ```dockerfile
  # Dockerfile:2, 10-12
  FROM node:22-alpine AS builder
  ...
  RUN --mount=type=secret,id=git_token,required=false \
      if [ -f /run/secrets/git_token ]; then export GIT_TOKEN="$(cat /run/secrets/git_token)"; fi && \
      npm run build
  ```
- **Why It Matters:** Official `node:22-alpine` images do **not** include `git` or `openssh-client` by default. Any Docker/VPS build that syncs a real remote repository in `config/projects.json` will fail inside `runGitSparseCloneBase` with `spawn git ENOENT`. Locally and in default starter smoke builds this stays hidden because `vib-docs-engine` (`scripts/sync-docs.mjs:533-552`) and `YOUR_ORG` entries (`scripts/sync-docs.mjs:553-567`) fall back to local `./docs` without invoking `git`.
- **Recommended Fix:** Add `RUN apk add --no-cache git` (and `openssh-client` if SSH remotes are supported) in `Dockerfile` before `npm run build`.

---

### `AUDIT-F02` — MEDIUM-HIGH (Logic Bug): `selectActiveTarget` ignores `registryEntry.docsType` when `portalType === "all"`

- **Location:** `src/utils/vibtoolsConfig.ts:391-442` (specifically `lines 430-442`), affecting `config/site.config.json:8` (`"portalType": "all"`).
- **Proof (Exact Code):**
  ```ts
  // src/utils/vibtoolsConfig.ts:431-442
  if (targets.users && !targets.developer) {
    return { matched: true, targetConfig: targets.users, effectiveDocsType: "users" };
  }
  if (targets.developer && !targets.users) {
    return { matched: true, targetConfig: targets.developer, effectiveDocsType: "developer" };
  }
  return {
    matched: true,
    targetConfig: targets.users ?? targets.developer,
    effectiveDocsType: declaredDocsType ?? "both",
  };
  ```
- **Live Reproduction Proof (`npx tsx -e ...`):**
  - **Input:** `portalType: "all"`, `registryEntry: { repoUrl: "https://github.com/vibdocs/invio.git", slug: "invio-sdk", docsType: "developer" }`, `remoteConfig: { docsType: "both", targets: { users: { slug: "invio", docsPath: "docs/users" }, developer: { slug: "invio-sdk", docsPath: "docs/developer" } } }`
  - **Observed Output:**
    ```json
    {"matched":true,"project":{"slug":"invio-sdk","category":"Documentation","accentColor":"#7C3AED","repoUrl":"https://github.com/vibdocs/invio.git","branch":"main","docsPath":"docs/users","docsType":"both"}}
    ```
- **Why It Matters:** Separate `users` (`docs.vib.tools`) and `developer` (`developer.vibtools.io`) portals select the right target properly, **but** on a combined `portalType: "all"` portal (default root config), registering a dual-target repo's developer target via `"docsType": "developer"` + `--slug invio-sdk` silently pulls `targets.users` (`docs/users`) unless `docsPath` is also manually overridden.
- **Recommended Fix:** When `portalType === "all"` and `targets` has both keys, honor `registryDocsType === "developer"` -> `targets.developer` and `registryDocsType === "users"` -> `targets.users` before falling back to `targets.users ?? targets.developer`.

---

### `AUDIT-F03` — MEDIUM (Test Runner / Packaging Gap): Missing `"test"` script in `package.json` & extensionless test imports fail under Node native runner

- **Location:** `package.json:6-19`, `src/utils/search.test.ts:10`, `src/utils/seo.test.ts:9`, `src/utils/vibtoolsConfig.test.ts:9`.
- **Live Reproduction Proof:**
  - `node --experimental-strip-types --test src/utils/*.test.ts` -> exits `1` with:
    `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/applet/src/utils/search' imported from /app/applet/src/utils/search.test.ts` (and same for `./seo`, `./vibtoolsConfig`).
  - `npx tsx --test src/utils/*.test.ts` passes all `14/14` tests, **however** `tsx` is neither listed in `package.json` dependencies nor exposed via an `npm test` script (`package.json:6-19`).
- **Why It Matters:** Fresh CI containers running Node 22 without network-downloaded `npx tsx` (or expecting `npm test`) cannot run the unit test suite cleanly out of the box.
- **Recommended Fix:** Either add `"test": "node --experimental-strip-types --test src/utils/*.test.ts"` in `package.json` with `.ts` extensions in the `.test.ts` relative imports (requires `allowImportingTsExtensions` or Node resolution adjustment while keeping `tsc --noEmit` green), or install `tsx` as a `devDependency` and wire `"test": "tsx --test src/utils/*.test.ts"`.

---

### `AUDIT-F04` — MEDIUM (Limitation / Edit-URL Mismatch): Per-config `branch` inside `.vibtools/docs.config.json` cannot drive Git checkout

- **Location:** `scripts/sync-docs.mjs:279-280, 574-579, 624-633`, `src/utils/vibtoolsConfig.ts:486`, `src/components/docs/PrevNextNav.astro:44-49`.
- **Proof (Exact Code):**
  - `cloneMetadataFirst(entry, checkoutDirectory, token, ...)` (`scripts/sync-docs.mjs:279-280, 574-579`) clones `const branch = entry.branch || "main"` **before** `.vibtools/docs.config.json` is read (`line 580`).
  - In Step 2 (`scripts/sync-docs.mjs:624-633`), `addGitSparsePaths(repoRootForMetadata, extraPaths)` checks out `project.docsPath` on the **initially cloned branch**, never switching or fetching if `.vibtools/` (or `targets.*`) specifies a different `branch`.
  - Yet `resolvePortalProjectConfig` (`src/utils/vibtoolsConfig.ts:486`) populates `project.branch` from `.vibtools/` into `manifest.json`, and `PrevNextNav.astro:44-49` uses `product.branch` to generate `"Edit this page on Git"` links.
- **Why It Matters:** If a repository omits `branch` in `config/projects.json` (so `entry.branch` defaults to `"main"`) while setting `"branch": "docs"` in `.vibtools/docs.config.json` (or under `targets.developer`), sync either fails if `"main"` lacks `.vibtools/` or syncs `"main"` content while linking Edit buttons to `"docs"`.
- **Recommended Fix:** Either support fetching & checking out `project.branch` in Step 2 when `project.branch !== clonedBranch`, or fail/warn clearly when `.vibtools` `branch` differs from `entry.branch` (and document that `entry.branch` in `config/projects.json` must hold `.vibtools/`).

---

### `AUDIT-F05` — MEDIUM (Nginx Caching & Header Mismatch): `nginx.conf` marks non-hashed `/pagefind/` files `immutable` (1 year) and omits `public/_headers` rules

- **Location:** `nginx.conf:1-46` vs `public/_headers:1-37`.
- **Proof (Exact Code):**
  ```nginx
  # nginx.conf:25-29
  location ^~ /pagefind/ {
      try_files $uri =404;
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
  }
  ```
  Compared against `public/_headers:1-10, 15-33`:
  - `public/_headers` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `/pagefind/*` -> `max-age=3600, must-revalidate`, and `Content-Type: text/markdown; charset=utf-8` for `.md` endpoints.
- **Why It Matters:** `pagefind --site dist` generates `/pagefind/pagefind.js` and `/pagefind/pagefind-entry.json` with unhashed filenames. Serving them with `Cache-Control: public, max-age=31536000, immutable` on Docker/Nginx VPS deployments causes returning browsers to keep an outdated search index after new documentation is deployed until manual cache busting.
- **Recommended Fix:** Align `nginx.conf` `/pagefind/` caching with `public/_headers` (`public, max-age=3600, must-revalidate`) and mirror the security/Markdown headers in `nginx.conf`.

---

### `AUDIT-F06` — LOW-MEDIUM (UI Formatting Mismatch): Double `"vv"` prefix when `version` starts with `v`

- **Location:** `src/components/hub/ProjectCard.astro:57-61`, `src/components/docs/Topbar.astro:51-55`, `src/utils/vibtoolsConfig.ts:197-205`, `scripts/sync-docs.mjs:657-661`.
- **Proof (Exact Code):**
  - `ProjectCard.astro:59`: `v{version}`
  - `Topbar.astro:53`: `v{product.version}`
  - `vibtoolsConfig.ts:201`: stores raw `record.version.trim()` without stripping a leading `v`/`V`, and `sync-docs.mjs:657-661` prefers frontmatter / `.vibtools` raw `version` over `extractMarkdownMetadata` (which strips `v?`).
- **Why It Matters:** If a config author sets `"version": "v1.2.0"` instead of `"1.2.0"`, badges render literally as `vv1.2.0`.
- **Recommended Fix:** Normalize by stripping an optional leading `v`/`V` before prepending `v` in UI components (or normalizing cleanly at display/sync time).

---

### `AUDIT-F07` — LOW (Template Mismatch): `templates/github-notify-docs.yml` omits `.vibtools/**` path trigger

- **Location:** `templates/github-notify-docs.yml:7-8` vs `docs/adding-projects.md:135`.
- **Proof (Exact Code):**
  ```yaml
  # templates/github-notify-docs.yml:7-8
    paths:
      - "docs/**"
  ```
- **Why It Matters:** Users copying the template workflow directly will not rebuild portals when editing only `.vibtools/docs.config.json` or `.vibtools/logo.svg` / `.vibtools/logo.png` unless they manually add `- ".vibtools/**"`.
- **Recommended Fix:** Add `- ".vibtools/**"` to `paths` in `templates/github-notify-docs.yml`.

---

### `AUDIT-F08` — LOW (Script Edge Cases): `scripts/export-portal.mjs` placeholder detection & root `.vibtools/` residue

- **Location:** `scripts/export-portal.mjs:9-20, 60-84, 184-194` & `scripts/sync-docs.mjs:553-567`.
- **Proof (Exact Code):**
  1. `export-portal.mjs:185-189` checks `typeof project.repoUrl === "string" && project.repoUrl.includes("YOUR_ORG")`. When `projects.json` uses bare strings (like `"https://github.com/YOUR_ORG/inboxchecker.git"` in `config/presets/user-portal/projects.json:12`), `project.repoUrl` is `undefined`, so a preset with *only* bare URL placeholders would skip the reminder console message.
  2. `export-portal.mjs:9-20` copies the engine repo's own `.vibtools/` (`docsType: "developer"`) even when exporting `--portal user`. Additionally, `sync-docs.mjs:553-567` leaves `repoRootForMetadata = projectRoot` for `YOUR_ORG` starter placeholders, causing `invio`/`inboxchecker` starter smoke builds to copy `vib-docs-engine`'s `.vibtools/logo.png` as their logo until real repository URLs are supplied.
- **Recommended Fix:** Check `typeof project === "string" ? project : project?.repoUrl` in `export-portal.mjs:185-189`, and decide whether `export-portal.mjs` should omit engine-repo `.vibtools/` or clear `repoRootForMetadata` for `YOUR_ORG` starter fixtures in `sync-docs.mjs`.

---

### `AUDIT-F09` — LOW (Security Hardening Warning): `POST /api/webhook` is unauthenticated if `WEBHOOK_SECRET` is unset

- **Location:** `functions/api/webhook.ts:113-141`.
- **Proof (Exact Code):**
  ```ts
  // functions/api/webhook.ts:113-114
  const configuredSecret = (env.WEBHOOK_SECRET ?? "").trim();
  if (configuredSecret) {
  ```
- **Why It Matters:** If an operator sets `CF_DEPLOY_HOOK_URL` in Cloudflare Pages without setting `WEBHOOK_SECRET`, any unauthenticated `POST /api/webhook` request triggers a portal rebuild (build DoS / quota exhaustion). Notice `docs/deployment.md` advises setting `WEBHOOK_SECRET`, and `wrangler.toml:14` documents it as optional.
- **Recommended Fix:** Require `WEBHOOK_SECRET` (return HTTP `501` / fail closed when `WEBHOOK_SECRET` is missing unless explicitly opted out), or log/surface a prominent requirement in operator verification.

---

### `AUDIT-F10` — LOW (Build Deprecation & Transitive Audit Advisory)

1. **`@astrojs/mdx` deprecation warning (`astro.config.mjs:187-200`):**
   - **Live Proof (`npm run verify`):**
     `[WARN] [@astrojs/mdx] 'remarkPlugins' on 'mdx({...})' is deprecated. Pass it to 'unified({...})' from '@astrojs/markdown-remark' and set it as 'markdown.processor' instead — MDX will inherit it. Will be removed in a future major.`
   - **Exact Lines:** `astro.config.mjs:187-189` passes `remarkPlugins: sharedRemarkPlugins` inside `mdx({...})` even though `markdown.processor: unified({ remarkPlugins: sharedRemarkPlugins })` is already configured at `astro.config.mjs:198-200`.
2. **Transitive `npm audit --omit=dev` advisory:**
   - **Live Proof (`npm audit --omit=dev`):**
     `2 moderate severity vulnerabilities` on `postcss-selector-parser <6.1.5` (`GHSA-rj75-hqrm-r3gff`, quadratic complexity CSS parsing during build) pulled via `@tailwindcss/typography`. Build-time only (never exposed to runtime user CSS input), and `npm audit fix --force` warns of a breaking downgrade to `@tailwindcss/typography@0.5.4`; resolve via npm `overrides` or upstream bump only when verified compatible.

---

### `AUDIT-F11` — INFO (Pre-Deployment Checklist Reminder)

- Starter placeholder URLs still exist in `config/presets/user-portal/projects.json:3, 12` (`YOUR_ORG/invio.git`, `YOUR_ORG/inboxchecker.git`) and `config/presets/dev-portal/projects.json:4, 9` (`YOUR_ORG/vib-self-hosted.git`).
- Root `config/site.config.json` uses `"portalType": "all"` and `"domain": "https://docs.vib.tools"`; for live split deployments (`docs.vib.tools` vs `developer.vibtools.io`), generate standalone portal repositories/configs via `npm run export-portal -- --portal user|dev` with real repo URLs before production launch.

---

## 3. Recommended Pre-Release Priority Order (If Fixing Next)

1. **Must fix before Docker/VPS or multi-target `all` portal launch:** `AUDIT-F01` (`Dockerfile` `git`), `AUDIT-F02` (`selectActiveTarget` `portalType: "all"`), `AUDIT-F03` (`npm test` + runnable unit tests), `AUDIT-F05` (`nginx.conf` `/pagefind/` caching + headers).
2. **Should polish before release:** `AUDIT-F04` (`branch` in `.vibtools` vs sparse clone), `AUDIT-F06` (`vv` version badge guard), `AUDIT-F07` (`.vibtools/**` in `github-notify-docs.yml`), `AUDIT-F08` (`export-portal.mjs` placeholder warning), `AUDIT-F10` (`mdx` deprecation warning removal).
3. **Hardening decision:** `AUDIT-F09` (decide whether `WEBHOOK_SECRET` should fail closed on `/api/webhook`).
