# 001 — Full App & Cloudflare Pages/Functions Forensic Audit Report

**Audit Date:** 2026-11-18  
**Project:** `vib-docs-engine` (`astro@^7.4.12`, `output: "static"`)  
**Scope:** End-to-end forensic inspection of all checked-in pages, features, functions, APIs, build scripts, config/presets, manifests, lockfiles, and Cloudflare Pages & Functions integration files.  
**Prior Notes Archive Status:** All 7 prior development notes (`Phases 01–06`, `18/18` bugs, `6/6` error-handling enhancements, per-project `secretKey`, and initial Cloudflare scaffold) reached **100% COMPLETED / PASS** with zero carried-over open bugs.

---

## Part 1 — Full Application Inventory Audit (Pages, Features, Modules, Manifests)

### 1.1 Static Pages & Endpoints (`src/pages/`)

| Route / Endpoint | Source File | Runtime Type | Status | Cloudflare Pages Compatibility |
| :--- | :--- | :--- | :--- | :--- |
| `/` (Portal Hub) | `src/pages/index.astro` | Prerendered static HTML | **PASS** | Served 100% from Cloudflare CDN edge. |
| `/404.html` (Not Found) | `src/pages/404.astro` | Prerendered static HTML | **PASS** | Native Cloudflare Pages `/404.html` fallback. |
| `/<product>/[...slug]/` | `src/pages/[product]/[...slug].astro` | Prerendered static HTML (`getStaticPaths`) | **PASS** | Uses `node:path` only at build time; zero Node APIs in `dist/`. |
| `/llms.txt` | `src/pages/llms.txt.ts` | Prerendered static text (`prerender = true`) | **PARTIAL** | Static file emits cleanly, but inline `Cache-Control` header is ignored unless set in `public/_headers`. |
| `/<product>/llms.txt` | `src/pages/[product]/llms.txt.ts` | Prerendered static text (`prerender = true`) | **PARTIAL** | Strips YAML frontmatter safely via `gray-matter`; needs `public/_headers` rule for `Content-Type`/`Cache-Control`. |
| `/robots.txt` | `src/pages/robots.txt.ts` | Prerendered static text (`prerender = true`) | **PARTIAL** | Static file emits cleanly; needs `public/_headers` rule to match intended `Cache-Control`. |
| `/sitemap-index.xml` | `@astrojs/sitemap` (`astro.config.mjs:190`) | Build-time generated XML | **PASS** | Zero runtime dependencies; served directly from `dist/`. |
| `/pagefind/*` | `package.json:15` (`pagefind --site dist`) | Post-build static search index | **PASS** | Client-side WASM/JSON loaded lazily on `Ctrl+K`. |

### 1.2 Core Features, Layouts & UI Modules (`src/`)

| Layer | Checked-In Files | Verified Behavior | Keep Untouched? |
| :--- | :--- | :--- | :--- |
| **Layouts** | `src/layouts/BaseLayout.astro`, `HubLayout.astro`, `DocsLayout.astro` | Zero-flash dark/light theme, SEO/canonical/OG tags, 3-column desktop docs reader, responsive header & footer. | **YES — 100% Untouched** |
| **Hub UI** | `src/components/hub/CategoryTabs.astro`, `ProjectCard.astro` | Manifest-driven product cards, logo/monogram fallback, auto-hidden tabs when `<= 1` category. | **YES — 100% Untouched** |
| **Docs Reader UI** | `src/components/docs/Topbar.astro`, `Sidebar.astro`, `SidebarTree.astro`, `TableOfContents.astro`, `PrevNextNav.astro` | Product switcher, mobile drawer, normalized active sidebar state, scroll-spy TOC, optional `repoUrl` edit link. | **YES — 100% Untouched** |
| **MDX & Interactive UI** | `src/components/mdx/Callout.astro`, `CodeTabs.astro`, `src/components/ui/SearchModal.astro`, `ThemeToggle.astro` | Auto-bound code tabs, callouts, Pagefind scoped/global search + keyboard navigation (`ArrowDown`/`ArrowUp`/`Enter`). | **YES — 100% Untouched** |
| **Utils & Schema** | `src/utils/sidebar.ts`, `manifest.ts`, `theme.ts`, `src/content.config.ts`, `src/styles/global.css` | Deterministic sidebar/pagination, `draft: true` filtering, strict hex/monogram helpers, Tailwind v4 tokens. | **YES — 100% Untouched** |

### 1.3 CLI Scripts, Sync Engine, Configs & Manifests

| Module / Path | Purpose | Status | Notes |
| :--- | :--- | :--- | :--- |
| `scripts/sync-docs.mjs` | Git sparse-checkout sync, `secretKey` / `GIT_TOKEN` auth, `normalizeDocsTree`, logo validation, manifest generation | **PASS** | Supports public repos, global `GIT_TOKEN`, and unlimited per-project `secretKey` (`"$VAR"`). Strips secrets from `manifest.json`. |
| `scripts/add-project.mjs` | Interactive project registry CLI with `docsPath`, `secretKey`, `gitUsername`, paired CTA validation | **PASS** | Atomic `.tmp` rename write to `config/projects.json`. |
| `scripts/export-portal.mjs` | Dual-portal exporter (`user` / `dev`) excluding `notes/`, `.wrangler/`, `dist/`, presets | **PASS** | Copies Cloudflare files cleanly, **but** copies `public/_redirects` containing user-portal domain even for `dev` portal (`CF-AUDIT-01`). |
| `scripts/verify-build.mjs` | Checks `dist/` required assets, HTML routes, internal `href` + `img[src]`, and Cloudflare file presence | **PARTIAL** | Checks file existence, **but** does not validate `_routes.json` JSON validity or reject unsupported custom-domain `_redirects` rules (`CF-AUDIT-06`). |
| `config/` & `presets/` | `site.config.json`, `projects.json`, `presets/user-portal/*`, `presets/dev-portal/*` | **PASS** | Clean config separation. |
| `MANIFEST.md` & Folder `MANIFEST.md`s | Inventory of tracked non-routable folders and root files | **PARTIAL** | Root `MANIFEST.md:10` and `Dockerfile:5` list `package-lock.json`, while repo only has `bun.lock` (`CF-AUDIT-02`). |

### 1.4 Existing Cloudflare Pages & Functions Layer

| File | Current Implementation | Status | Forensic Finding |
| :--- | :--- | :--- | :--- |
| `wrangler.toml` | `name = "vib-docs-engine"`, `pages_build_output_dir = "dist"`, `compatibility_date = "2025-01-01"` | **PARTIAL** | References `#:schema node_modules/wrangler/config-schema.json`, but `wrangler` & `@cloudflare/workers-types` are not in `devDependencies` (`CF-AUDIT-05`). |
| `.node-version` & `.nvmrc` | Contains `22` | **PARTIAL** | Loose `22` tag may resolve below Astro 7's `>=22.23.4` (`astro/bin/astro.mjs:31`) on older CI build images (`CF-AUDIT-03`). |
| `public/_headers` | Security headers + cache rules for `/_astro/*`, `/pagefind/*`, `/logos/*` | **PARTIAL** | Missing rules for `/llms.txt`, `/*/llms.txt`, and `/robots.txt` (`CF-AUDIT-04`). |
| `public/_redirects` | `https://docs.vibtools.io/* https://docs.vib.tools/:splat 301` | **DEFECT** | Cloudflare Pages `_redirects` only supports relative paths or `*.pages.dev` domains; custom external domain redirects fail/are ignored and leak into `dev-portal` (`CF-AUDIT-01`). |
| `public/_routes.json` | `{"version": 1, "include": ["/api/*"], "exclude": []}` | **PASS** | Optimal routing: static assets bypass Function billing/quota; `/api/*` invokes Functions. |
| `functions/api/health.ts` | `onRequestGet()` returns `{ ok, service, runtime, timestamp }` | **PASS** | Valid edge GET endpoint; `no-store` cache header. |
| `functions/api/webhook.ts` | `onRequestPost()` checks `WEBHOOK_SECRET` via header/Bearer and POSTs to `CF_DEPLOY_HOOK_URL` | **PARTIAL** | Missing GitHub `X-Hub-Signature-256` & Gitea/Forgejo HMAC-SHA256 verification and optional branch filter (`CF-AUDIT-05`). |

---

## Part 2 — Detailed Forensic Audit Findings (Exact Code Proof)

### `CF-AUDIT-01` [HIGH] — Invalid Custom-Domain Rule in `public/_redirects`
- **File & Line:** `public/_redirects:1-2`
- **Code Proof:**
  ```text
  # Cloudflare Pages Redirect Rules
  https://docs.vibtools.io/* https://docs.vib.tools/:splat 301
  ```
- **Why It Matters:** Cloudflare Pages `_redirects` rejects or ignores arbitrary custom-domain source URLs (it supports relative paths like `/old /new 301` or `*.pages.dev` -> custom domain). Furthermore, `scripts/export-portal.mjs` copies `public/_redirects` into both `user` and `dev` portals, leaking the `docs.vibtools.io` user-portal rule into `developer.vibtools.io`. Custom domain redirects must live in Cloudflare Zone Redirect Rules (`docs/deployment.md`), while `public/_redirects` should contain only valid relative/safe rules or clean comments.

### `CF-AUDIT-02` [HIGH] — Lockfile Mismatch (`bun.lock` Present, `package-lock.json` Missing)
- **Files & Lines:** `MANIFEST.md:10`, `Dockerfile:5-6`, `docs/deployment.md:21`, `README.md:77`, root directory (`/bun.lock` exists; `/package-lock.json` does not exist)
- **Code Proof:**
  ```dockerfile
  # Dockerfile:5-6
  COPY package.json package-lock.json ./
  RUN npm ci
  ```
- **Why It Matters:** `package-lock.json` is referenced in `Dockerfile`, `MANIFEST.md`, `project/04-codebase-reference.md`, and `README.md`, yet only `bun.lock` is checked in. Running `npm ci` in CI or Docker fails with `ENOENT` unless `package-lock.json` is generated (`npm install --package-lock-only`) or build docs/Dockerfile match `bun.lock`. Generating `package-lock.json` (and keeping `bun.lock` if Bun is used locally) restores `npm ci` + Cloudflare npm build reproducibility.

### `CF-AUDIT-03` [MEDIUM] — Node.js 22 Exact Version Pinning & `NODE_OPTIONS` Preservation
- **Files & Lines:** `.node-version:1`, `.nvmrc:1`, `package.json:15`, `node_modules/astro/bin/astro.mjs:28-31`
- **Code Proof:**
  ```js
  // node_modules/astro/bin/astro.mjs:28-31
  const IS_STACKBLITZ = !!process.versions.webcontainer;
  const engines = IS_STACKBLITZ ? '>=22.22.0' : '>=22.23.4';
  ```
  ```json
  // package.json:15
  "build": "NODE_OPTIONS=\"--import data:text/javascript,process.versions.webcontainer='1'\" astro build && pagefind --site dist"
  ```
- **Why It Matters:**
  1. Pinning `.node-version` and `.nvmrc` to `22.24.0` (or exact `22.23.2` / `>=22.23.4`) prevents Cloudflare Pages from selecting an older Node `22.x` minor release (such as `22.12.0`–`22.21.x`) that Astro 7 rejects.
  2. Overwriting `NODE_OPTIONS="..."` directly discards any CI `NODE_OPTIONS` (e.g. `--max-old-space-size`). Preserving `"${NODE_OPTIONS:+$NODE_OPTIONS }--import ..."` or checking Node version safely keeps CI flags intact.

### `CF-AUDIT-04` [MEDIUM] — Static AI/Crawler Endpoints Lack `public/_headers` Rules
- **Files & Lines:** `src/pages/llms.txt.ts:40-43`, `src/pages/[product]/llms.txt.ts:91-94`, `src/pages/robots.txt.ts:10-13`, `public/_headers:1-14`
- **Why It Matters:** With `output: "static"`, Astro writes `llms.txt` and `robots.txt` as static files in `dist/`. Response headers returned by `APIRoute` (`Cache-Control: public, max-age=300`) are not executed on Cloudflare Pages CDN. Adding `/llms.txt`, `/*/llms.txt`, and `/robots.txt` rules to `public/_headers` preserves exact intended caching and UTF-8 charset headers on Cloudflare's edge.

### `CF-AUDIT-05` [MEDIUM] — Pages Functions Webhook Provider Signature Gap & TS/Wrangler Tooling
- **Files & Lines:** `functions/api/webhook.ts:22-72`, `functions/api/health.ts:1-7`, `tsconfig.json:1-5`, `wrangler.toml:1`
- **Code Proof:**
  ```ts
  // functions/api/webhook.ts:22-34
  function extractRequestSecret(request: Request): string {
    const directHeader =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("x-gitlab-token") ?? "";
  ```
- **Why It Matters:**
  1. Direct **GitHub** repo webhooks send `X-Hub-Signature-256: sha256=<hmac>` and **Gitea/Forgejo** send `X-Gitea-Signature` / `X-Forgejo-Signature`, NOT `Authorization: Bearer` or `X-Webhook-Secret`. Supporting Web Crypto HMAC-SHA256 verification alongside `X-Gitlab-Token` and `X-Webhook-Secret` makes `POST /api/webhook` natively compatible with **GitHub, GitLab, Gitea, and Forgejo** without extra CI relay scripts.
  2. Optional `ALLOWED_BRANCHES` (e.g. `main`) prevents unnecessary Cloudflare Pages rebuilds when feature branches are pushed.
  3. Adding an isolated `functions/tsconfig.json` cleanly decouples Cloudflare Worker/Pages Function types from Astro's DOM `tsconfig.json`.

### `CF-AUDIT-06` [LOW] — Verifier Lacks `_routes.json` Schema & `_redirects` Validation
- **File & Line:** `scripts/verify-build.mjs:118-143`
- **Why It Matters:** Currently `verify-build.mjs` checks that `dist/_headers`, `dist/_redirects`, and `dist/_routes.json` exist on disk, but does not parse `dist/_routes.json` (`version === 1`, valid `include`/`exclude` arrays) or detect invalid custom-domain entries in `dist/_redirects`.

### `CF-AUDIT-07` [INFO] — Multi-Repo Private `GIT_TOKEN` Strategy (Confirmed Ready)
- **File & Line:** `scripts/sync-docs.mjs:262-300, 336-375`
- **Status:** **ALREADY WORKING.** Single `GIT_TOKEN` works across all private repos owned by the same org/account, AND unlimited independent private repos across different accounts/hosts are supported via per-project `"secretKey": "$GIT_TOKEN_REPO1"`, `"$GIT_TOKEN_REPO2"` mapped to Cloudflare Pages Environment Variables.

---

## বাংলা সারসংক্ষেপ (Bangla Forensic Audit Summary)

### ১. অ্যাপের বর্তমান অবস্থা (আগের সব নোট ও ফিচার অডিট)
- আগের ডেভেলপমেন্ট নোটগুলোর (`Phases 01–06`, `18/18` বাগ, `secretKey` ফিচার, এবং প্রাথমিক Cloudflare ফাইল) **১০০% কাজ সম্পন্ন (COMPLETED / PASS)** এবং কোনো পুরোনো পেন্ডিং বাগ বাকি নেই।
- অ্যাপের মূল ফিচারগুলো (Hub পেজ, ৩-কলাম ডক্স রিডার, Sidebar, Table of Contents, Prev/Next, MDX Callout & CodeTabs, Pagefind Search, Dark/Light Theme, `sitemap-index.xml`, `llms.txt`, `sync-docs.mjs`) পুরোপুরি **Static (`output: "static"`)** এবং Cloudflare Pages CDN-এ চালানোর জন্য নিরাপদ — এগুলোতে **কোনো পরিবর্তন করার প্রয়োজন নেই**।

### ২. ফরেনসিক অডিটে পাওয়া Cloudflare Pages & Functions সংক্রান্ত ৭টি নির্দিষ্ট গ্যাপ / মিসম্যাচ
1. **`CF-AUDIT-01` [HIGH] — `public/_redirects` ভুল রুল:** `public/_redirects:2`-এ `https://docs.vibtools.io/* ...` লেখা আছে। Cloudflare Pages-এর `_redirects` ফাইল শুধু relative path (`/old /new 301`) বা `*.pages.dev` সাপোর্ট করে—কাস্টম ডোমেইন রিডাইরেক্ট কাজ করে না (কাস্টম ডোমেইনের জন্য Cloudflare Dashboard Redirect Rules ব্যবহার করতে হয়) এবং এটি `dev-portal` এক্সপোর্টেও কপি হয়ে যাচ্ছে।
2. **`CF-AUDIT-02` [HIGH] — `package-lock.json` মিসিং:** রুট ফোল্ডারে `bun.lock` আছে কিন্তু `package-lock.json` নেই, অথচ `Dockerfile`, `MANIFEST.md` ও `docs/deployment.md`-এ `npm ci` / `package-lock.json` ব্যবহার করা হয়েছে। Cloudflare Pages-এ `npm ci` ফেল করতে পারে যদি `package-lock.json` না থাকে।
3. **`CF-AUDIT-03` [MEDIUM] — Node 22 পিন ও `NODE_OPTIONS`:** `.node-version` ও `.nvmrc`-তে শুধু `22` দেওয়া আছে; Astro `7.4.12` রান হতে Node `>=22.23.4` (বা `webcontainer` ফ্ল্যাগে `>=22.22.0`) লাগে। পাশাপাশি `package.json`-এর `build` স্ক্রিপ্টে `NODE_OPTIONS` আগের CI ফ্ল্যাগ ওভাররাইট না করে preserve করা উচিত।
4. **`CF-AUDIT-04` [MEDIUM] — `/llms.txt` ও `/robots.txt` ক্যাশ হেডার:** স্ট্যাটিক বিল্ডে `src/pages/llms.txt.ts` ও `robots.txt.ts`-এর কোডের ভেতরের `Cache-Control` হেডার Cloudflare Pages-এ কাজ করে না; এগুলো `public/_headers`-এ যোগ করতে হবে।
5. **`CF-AUDIT-05` [MEDIUM] — `functions/api/webhook.ts` ও TypeScript আইসোলেশন:** বর্তমান `/api/webhook` শুধু `X-Webhook-Secret` / `X-Gitlab-Token` / `Bearer` চেক করে; GitHub-এর `X-Hub-Signature-256` এবং Gitea/Forgejo-এর `X-Gitea-Signature` / `X-Forgejo-Signature` (HMAC-SHA256) সাপোর্ট ও ব্রাঞ্চ ফিল্টার (`ALLOWED_BRANCHES`) নেই, এবং `functions/tsconfig.json` আলাদা করা নেই।
6. **`CF-AUDIT-06` [LOW] — `verify-build.mjs` ভ্যালিডেশন:** `verify-build.mjs` এখন `_routes.json` ও `_redirects` ফাইল আছে কি না চেক করে, কিন্তু `_routes.json`-এর JSON স্কিমা বা `_redirects`-এর অবৈধ ডোমেইন রুল যাচাই করে না।
7. **`CF-AUDIT-07` [INFO] — মাল্টিপল প্রাইভেট রেপো `GIT_TOKEN`:** `scripts/sync-docs.mjs` ইতিমধ্যেই একসাথে সিঙ্গেল `GIT_TOKEN` এবং একাধিক প্রজেক্টের আলাদা `"secretKey": "$GIT_TOKEN_..."`—দুটিই সাপোর্ট করে।
