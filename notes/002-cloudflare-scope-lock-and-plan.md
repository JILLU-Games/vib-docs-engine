# 002 — Cloudflare Pages & Functions Scope-Locked Update Plan

**Purpose:** Exact, risk-free, **Scope-Locked** implementation blueprint to make `vib-docs-engine` 100% deterministic and production-grade on **Cloudflare Pages & Functions**, while keeping **all existing Astro pages, UI components, design system, sync logic, and presets untouched**.

---

## 1. Strict Guarantee: What Remains 100% Untouched (Out of Scope / Forbidden)

To prevent regressions, **zero changes** are allowed to any of the following existing working systems:
- **Pages & Routes:** `src/pages/index.astro`, `src/pages/404.astro`, `src/pages/[product]/[...slug].astro`, `src/pages/[product]/llms.txt.ts`, `src/pages/llms.txt.ts`, `src/pages/robots.txt.ts`
- **Layouts & Styles:** `src/layouts/*`, `src/styles/global.css`
- **Components:** `src/components/docs/*`, `src/components/hub/*`, `src/components/mdx/*`, `src/components/ui/*`
- **Content & Utils:** `src/content.config.ts`, `src/utils/sidebar.ts`, `src/utils/manifest.ts`, `src/utils/theme.ts`, `astro.config.mjs`
- **Sync & CLI Core Logic:** `scripts/sync-docs.mjs`, `scripts/add-project.mjs`
- **Configs & Presets:** `config/site.config.json`, `config/projects.json`, `config/presets/*`
- **Docs Content & Templates:** `docs/index.md`, `docs/adding-projects.md`, `docs/portal-user-guide.md`, `templates/*`, `nginx.conf`

---

## 2. Exact Cloudflare Assets, APIs & Functions Checklist

### A. Cloudflare Configuration & Static Edge Files
| Artifact | Action | Purpose (Without Breaking App Features) |
| :--- | :--- | :--- |
| `package.json` | **Update** | Preserve existing `NODE_OPTIONS` in `"build"`, keep `pagefind` in `dependencies`, add `"cf:dev"` / `"cf:verify"` helper scripts (using `wrangler` if installed locally or `npx`). |
| `package-lock.json` | **Create** | Generate via `npm install --package-lock-only` so `npm ci`, `Dockerfile`, and Cloudflare Pages npm installs work deterministically alongside `bun.lock`. |
| `.node-version` & `.nvmrc` | **Update** | Pin `22.23.2` (or `22.24.0` / `>=22.23.4`) to satisfy Astro `7.4.12` CLI requirements on Cloudflare Pages build images. |
| `wrangler.toml` | **Verify / Refine** | Keep `pages_build_output_dir = "dist"`, `compatibility_date = "2025-01-01"`, document `ALLOWED_BRANCHES` env var in comments. |
| `public/_headers` | **Update** | Add `/llms.txt`, `/*/llms.txt`, and `/robots.txt` `Content-Type` + `Cache-Control` rules matching static Astro routes. |
| `public/_redirects` | **Fix (`CF-AUDIT-01`)** | Remove invalid custom-domain `https://docs.vibtools.io/*` rule; replace with valid relative path comment/template so `_redirects` is valid for both User & Dev portals. |
| `public/_routes.json` | **Keep / Verify** | Keep `{"version": 1, "include": ["/api/*"], "exclude": []}` so 100% of static docs routes serve from CDN edge. |

### B. Cloudflare Pages Functions & APIs (`functions/`)
| API / Endpoint | File | Action | Functionality |
| :--- | :--- | :--- | :--- |
| `functions/tsconfig.json` | `functions/tsconfig.json` | **Create** | Isolated TypeScript config for Cloudflare Pages Functions (`ES2022`, `WebWorker` / Worker globals) without polluting Astro DOM types. |
| `GET /api/health` | `functions/api/health.ts` | **Keep / Minor Type Clean** | Edge health & readiness check (`200 JSON`, `Cache-Control: no-store`). |
| `POST /api/webhook` | `functions/api/webhook.ts` | **Upgrade (`CF-AUDIT-05`)** | Keep `X-Webhook-Secret`, `X-Gitlab-Token`, and `Authorization: Bearer` checks; **add Web Crypto HMAC-SHA256 verification** for GitHub (`X-Hub-Signature-256`) & Gitea/Forgejo (`X-Gitea-Signature` / `X-Forgejo-Signature`), plus optional `ALLOWED_BRANCHES` ref filtering before calling `CF_DEPLOY_HOOK_URL`. |

*(Note: Optional read-only `GET /api/projects` is placed in the **Future Plan** in `notes/003` so the user can decide after build rollout.)*

### C. Build Verification & Documentation Sync
| File | Action | Purpose |
| :--- | :--- | :--- |
| `scripts/verify-build.mjs` | **Update (`CF-AUDIT-06`)** | Parse and validate `dist/_routes.json` (`version === 1`, array checks), warn/fail if `dist/_redirects` contains unsupported external custom-domain rules, and verify `functions/tsconfig.json`. |
| `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` | **Update** | Sync durable docs with verified Cloudflare Pages & Functions behavior and custom-domain Zone Redirect rules. |

---

## 3. Compact 3-Phase Implementation Plan & Exact Scope Lock

### `CF-Phase 01` — Build Determinism, Lockfile, Node Pin & Edge Static Rules
- **Fixes:** `CF-AUDIT-01`, `CF-AUDIT-02`, `CF-AUDIT-03`, `CF-AUDIT-04`
- **Scope Lock (ALLOWED to Modify):**
  - `package.json`
  - `package-lock.json` *(new)*
  - `.node-version`
  - `.nvmrc`
  - `public/_headers`
  - `public/_redirects`
- **Scope Lock (FORBIDDEN to Modify):**
  - All of `src/*`, `scripts/*`, `functions/*`, `config/*`, `astro.config.mjs`.
- **Exact File Proofs & Patches:**
  1. Generate `package-lock.json` using `npm install --package-lock-only` without altering dependency versions in `package.json`.
  2. Update `package.json` `"build"` to preserve existing CI `NODE_OPTIONS`:
     `NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import data:text/javascript,process.versions.webcontainer='1'" astro build && pagefind --site dist`
  3. Update `.node-version` and `.nvmrc` from `22` to `22.24.0` (above Astro 7's `>=22.23.4` threshold; fallback `NODE_OPTIONS` stays safe locally on `22.23.2`).
  4. Append `/llms.txt`, `/*/llms.txt`, and `/robots.txt` header blocks in `public/_headers`.
  5. Clean `public/_redirects` to contain valid relative-redirect examples only (removing `https://docs.vibtools.io/*` per Cloudflare Pages `_redirects` rules).
- **Verification Gate:** `npm run build && npm run verify && npm run lint`.

---

### `CF-Phase 02` — Cloudflare Pages Functions & Multi-Provider Webhook Hardening
- **Fixes:** `CF-AUDIT-05`
- **Scope Lock (ALLOWED to Modify):**
  - `functions/tsconfig.json` *(new)*
  - `functions/api/health.ts`
  - `functions/api/webhook.ts`
  - `wrangler.toml`
- **Scope Lock (FORBIDDEN to Modify):**
  - All of `src/*`, `scripts/*`, `public/*`, `config/*`, `package.json`, `astro.config.mjs`.
- **Exact File Proofs & Patches:**
  1. Create `functions/tsconfig.json` targeting `ES2022`, `moduleResolution: "bundler"`, `strict: true`, `noEmit: true` for clean isolated typechecking of edge handlers.
  2. Upgrade `functions/api/webhook.ts`:
     - Keep existing `X-Webhook-Secret`, `X-Gitlab-Token`, and `Authorization: Bearer` validation untouched.
     - Add `verifyHmacSha256Signature(secret, rawBody, signatureHeader)` using standard Web Crypto (`crypto.subtle.importKey` + `crypto.subtle.sign`) for:
       - GitHub: `X-Hub-Signature-256: sha256=<hex>`
       - Gitea / Forgejo: `X-Gitea-Signature` / `X-Forgejo-Signature` (`<hex>`)
     - Add optional `env.ALLOWED_BRANCHES` (comma-separated, e.g. `"main,docs"`) check against JSON payload `ref` (`refs/heads/<branch>`); if payload belongs to an unconfigured branch, return `200 { ok: true, skipped: true, reason: "branch_ignored" }` without wasting a Pages build!
  3. Update `wrangler.toml` comments to document `ALLOWED_BRANCHES`.
- **Verification Gate:** `npm run lint` (`tsc --noEmit`) + `npx tsc -p functions/tsconfig.json --noEmit` + unit test (`node --test`) or simulated signature check via Node script if applicable.

---

### `CF-Phase 03` — Verifier Upgrade & Documentation Synchronization
- **Fixes:** `CF-AUDIT-06`
- **Scope Lock (ALLOWED to Modify):**
  - `scripts/verify-build.mjs`
  - `docs/deployment.md`
  - `MANIFEST.md`
  - `project/04-codebase-reference.md`
  - `project/CHANGELOG.md`
  - `notes/003-cloudflare-phase-tracker-and-future-plan.md`
- **Scope Lock (FORBIDDEN to Modify):**
  - All of `src/*`, `functions/*`, `public/*`, `config/*`, `package.json`, `astro.config.mjs`, `scripts/sync-docs.mjs`, `scripts/add-project.mjs`.
- **Exact File Proofs & Patches:**
  1. Update `scripts/verify-build.mjs` to parse `dist/_routes.json` (`version === 1`, array validation on `include`/`exclude`) and validate `dist/_redirects` contains no non-`pages.dev` external domain source URLs.
  2. Update `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, and `project/CHANGELOG.md` to match verified implementation.
- **Verification Gate:** `npm run verify && npm run lint` + `npm run export-portal` smoke check.

---

## বাংলা সারসংক্ষেপ (Bangla Scope-Locked Update Plan)

### ১. কী কী পরিবর্তন করা হবে না (১০০% Untouched Guarantee)
- অ্যাপের কোনো Astro পেজ (`index.astro`, `404.astro`, `[...slug].astro`, `llms.txt.ts`, `robots.txt.ts`), লেআউট, Tailwind CSS ডিজাইন, UI কম্পোনেন্ট (`Sidebar`, `Topbar`, `SearchModal`, `CodeTabs`, `Callout`, `ThemeToggle`), `sync-docs.mjs`, `add-project.mjs`, বা `config/` প্রিসেটে **কোনো হাত দেওয়া হবে না**।

### ২. ৩টি কমপ্যাক্ট ও রিস্ক-ফ্রি ফেজ (Scope-Locked)
- **CF-Phase 01 (Build, Lockfile, Node & Edge Headers/Redirects):**
  - `package-lock.json` জেনারেট করা (`npm ci` ও Cloudflare npm বিল্ডের জন্য)।
  - `.node-version` ও `.nvmrc`-তে `22.24.0` পিন করা এবং `package.json`-এ CI `NODE_OPTIONS` সংরক্ষণ করা।
  - `public/_headers`-এ `/llms.txt`, `/*/llms.txt`, এবং `/robots.txt`-এর ক্যাশ/চারসেট রুল যোগ করা।
  - `public/_redirects` থেকে অবৈধ কাস্টম-ডোমেইন রুল (`https://docs.vibtools.io/*`) সরিয়ে বৈধ Cloudflare `_redirects` ফরম্যাটে আনা (কাস্টম ডোমেইন রিডাইরেক্ট Cloudflare Zone Rules-এ থাকবে)।
- **CF-Phase 02 (Cloudflare Pages Functions ও Webhook Security):**
  - `functions/tsconfig.json` যোগ করে Worker/Pages Functions টাইপ আলাদা করা।
  - `functions/api/webhook.ts` আপগ্রেড করে GitHub (`X-Hub-Signature-256`), Gitea/Forgejo (`X-Gitea-Signature`/`X-Forgejo-Signature`) HMAC-SHA256 ভেরিফিকেশন ও অপশনাল `ALLOWED_BRANCHES` ফিল্টার যোগ করা।
- **CF-Phase 03 (Verifier & Docs Sync):**
  - `scripts/verify-build.mjs`-এ `_routes.json` ও `_redirects` সিনট্যাক্স চেক যোগ করা এবং `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, ও `project/CHANGELOG.md` আপডেট করা।
