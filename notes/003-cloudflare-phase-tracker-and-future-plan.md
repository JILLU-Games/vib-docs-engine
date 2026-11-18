# 003 — Cloudflare Phase Tracker & Future Plan

**Purpose:** Live execution log for Cloudflare Pages & Functions hardening (`CF-Phase 01` – `CF-Phase 03`), archived summary of completed baseline phases (`Phases 01–06`), and Future Plan decisions reserved for the user.

---

## 1. Prior Notes Archive Summary (100% Completed / Passed)

All 7 prior planning and execution notes were reviewed and cleared on `2026-11-18`. Every item in those notes passed verification with **zero pending items carried over**:
- **Baseline Freeze:** Dev server on `0.0.0.0:3000`, Node `v22.23.2` compatibility, 3-column `DocsLayout` alignment — **PASSED**
- **Phases 01–04 (`BUG-01` – `BUG-18`, `EH-01` – `EH-06`):** Clean docs tree normalization, draft exclusion, remark `.md`/`.mdx` link rewriting, relative `verify-build.mjs`, dev Pagefind middleware, keyboard search navigation, `CodeTabs`, CLI validation, portal exporter exclusions, YAML-stripped `llms.txt`, hardened `Dockerfile` — **100% PASSED**
- **Phase 05:** Per-project `secretKey` / `gitToken` / `gitTokenEnv` / `gitUsername` + public/private repo auto-sync & manifest stripping — **100% PASSED**
- **Phase 06:** Initial Cloudflare Pages scaffold (`wrangler.toml`, `.node-version`, `.nvmrc`, `public/_headers`, `public/_redirects`, `public/_routes.json`, `functions/api/health.ts`, `functions/api/webhook.ts`) — **100% PASSED** *(with remaining Cloudflare-specific gaps documented in `notes/001-full-app-forensic-audit.md`)*

---

## 2. Cloudflare Update Phase Tracker (`CF-Phase 01` – `CF-Phase 03`)

| Phase | Title | Audit Findings | Status | Files Locked |
| :--- | :--- | :--- | :--- | :--- |
| **CF-Phase 01** | Build Determinism, Lockfile, Node Pin & Edge Headers/Redirects | `CF-AUDIT-01`, `CF-AUDIT-02`, `CF-AUDIT-03`, `CF-AUDIT-04` | **COMPLETED (Verified 2026-11-18)** | `package.json`, `package-lock.json`, `.node-version`, `.nvmrc`, `public/_headers`, `public/_redirects` |
| **CF-Phase 02** | Cloudflare Pages Functions & Multi-Provider Webhook Hardening | `CF-AUDIT-05` | **COMPLETED (Verified 2026-11-18)** | `functions/tsconfig.json`, `functions/api/health.ts`, `functions/api/webhook.ts`, `wrangler.toml` |
| **CF-Phase 03** | Build Verifier Upgrade & Documentation Sync | `CF-AUDIT-06` | **COMPLETED (Verified 2026-11-18)** | `scripts/verify-build.mjs`, `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` |

### CF-Phase 01 Execution Proof (2026-11-18)
- **Modified / Added Files:** `package.json` (preserved CI `NODE_OPTIONS` across `dev`/`build`/`preview`), `package-lock.json` (generated cleanly via `npm install --package-lock-only`), `.node-version` & `.nvmrc` (`22.24.0`), `public/_headers` (added `/llms.txt`, `/*/llms.txt`, `/robots.txt` cache/UTF-8 headers), `public/_redirects` (removed invalid custom-domain rule `https://docs.vibtools.io/*`).
- **Scope Lock Check:** Zero modifications to `src/*`, `scripts/*`, `functions/*`, `config/*`, or `astro.config.mjs`.
- **Verification:** `NODE_OPTIONS="--max-old-space-size=2048" npm run build && node scripts/verify-build.mjs` passed (`6` HTML pages, `9` required assets, `4` Pagefind pages, `0` broken links); `tsc --noEmit` passed.

### CF-Phase 02 Execution Proof (2026-11-18)
- **Modified / Added Files:** `functions/tsconfig.json` (isolated `ES2022` + `WebWorker` TypeScript config), `functions/api/health.ts` (added `405` Method Not Allowed fallback), `functions/api/webhook.ts` (added Web Crypto `HMAC-SHA256` verification for GitHub `X-Hub-Signature-256`, Gitea `X-Gitea-Signature`, and Forgejo `X-Forgejo-Signature`, plus `ALLOWED_BRANCHES` ref filtering), `wrangler.toml` (documented `ALLOWED_BRANCHES`).
- **Scope Lock Check:** Zero modifications to `src/*`, `scripts/*`, `public/*`, `config/*`, `package.json`, or `astro.config.mjs`.
- **Verification:** `npx tsc -p functions/tsconfig.json --noEmit` passed; automated Node runtime assertions (`7/7`) verified `GET /api/health`, `405` fallbacks, `401` invalid signature rejection, GitHub HMAC (`202`), Forgejo HMAC + `ALLOWED_BRANCHES` branch skip (`200`), and GitLab token trigger (`202`).

### CF-Phase 03 Execution Proof (2026-11-18)
- **Modified Files:** `scripts/verify-build.mjs` (added `functions/tsconfig.json` check, `dist/_routes.json` JSON schema check, and `dist/_redirects` external custom-domain guard), `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`.
- **Scope Lock Check:** Zero modifications to `src/*`, `functions/*`, `public/*`, `config/*`, `package.json`, or `astro.config.mjs`.
- **Verification:** `npm run verify`, `npx tsc --noEmit`, `npx tsc -p functions/tsconfig.json --noEmit`, and dual-portal `export-portal` smoke test passed (`100%` Cloudflare Pages & Functions Ready).

---

## 3. Future Plan (Optional Decisions After Cloudflare Phases Finish)

These items are **not required** for static + webhook Cloudflare Pages deployment, and are intentionally deferred until you decide:

1. **Read-Only Portal Catalog API (`GET /api/projects`):**
   - Expose sanitized project metadata (`slug`, `title`, `category`, `version`, `route`) from Cloudflare Pages Functions if an external dashboard or status page needs live catalog JSON. *(Strictly read-only, zero tokens/secrets.)*
2. **Cloudflare Rate Limiting / WAF Rule for `/api/webhook`:**
   - Protect `POST /api/webhook` with a Cloudflare WAF Rate Limiting rule (e.g., max 10 requests/min per IP) in addition to `WEBHOOK_SECRET` / HMAC verification.
3. **Multi-Repo Private Token Automation Matrix:**
   - Standardize Cloudflare Pages Dashboard env vars (`GIT_TOKEN_<SLUG>`) paired with `"secretKey": "$GIT_TOKEN_<SLUG>"` in `config/projects.json` when onboarding multiple external private repositories across separate GitHub/GitLab/Forgejo accounts.
4. **Cloudflare Web Analytics Token Support:**
   - Optional `analyticsToken` field in `config/site.config.json` to inject Cloudflare's privacy-first beacon script cleanly in `BaseLayout.astro` if visitor analytics are desired later.

---

## বাংলা সারসংক্ষেপ (Bangla Tracker & Future Plan)

### ১. পুরোনো নোট আর্কাইভ স্ট্যাটাস
- আগের ডেভেলপমেন্ট নোটের **সবগুলো কাজ (`Phases 01–06`, `18/18` বাগ, `secretKey`, ও প্রাথমিক Cloudflare ফাইল) ১০০% সফলভাবে পাস করেছে**; কোনো পুরোনো কাজ বাকি নেই। তাই পুরোনো নোটগুলো পরিষ্কার করে Cloudflare Pages & Functions-এর এই আপডেট প্ল্যান তৈরি করা হয়েছে।

### ২. পরবর্তী ইমপ্লিমেন্টেশন ট্র্যাকার (`CF-Phase 01` – `CF-Phase 03`)
- **CF-Phase 01 (Pending):** `package-lock.json` জেনারেট, `.node-version`/`22.24.0` পিন, `package.json` `NODE_OPTIONS` ফিক্স, এবং `public/_headers` ও `public/_redirects` ফিক্স।
- **CF-Phase 02 (Pending):** `functions/tsconfig.json` তৈরি এবং `functions/api/webhook.ts`-এ GitHub/Gitea/Forgejo HMAC-SHA256 সিগনেচার + `ALLOWED_BRANCHES` ফিল্টার যোগ।
- **CF-Phase 03 (Pending):** `scripts/verify-build.mjs`-এ `_routes.json` ও `_redirects` ভ্যালিডেশন যোগ ও ডকুমেন্টেশন সিঙ্ক।

### ৩. ফিউচার প্ল্যান (ভবিষ্যতে সিদ্ধান্ত নেওয়ার জন্য)
1. **Read-only `GET /api/projects` API:** কোনো এক্সটার্নাল ড্যাশবোর্ডের দরকার হলে স্যানিটাইজড প্রজেক্ট লিস্ট JSON আকারে দেওয়ার জন্য।
2. **Cloudflare Rate Limiting (WAF):** `/api/webhook`-এ অতিরিক্ত স্প্যাম প্রোটেকশন যোগ করা।
3. **মাল্টি-রেপো টোকেন স্ট্যান্ডার্ড (`$GIT_TOKEN_<SLUG>`):** অনেকগুলো আলাদা প্রাইভেট রেপোর জন্য প্রতি প্রজেক্টে আলাদা এনভায়রনমেন্ট ভ্যারিয়েবল সেটআপ।
4. **Cloudflare Web Analytics টগল:** চাইলে ভবিষ্যতে `site.config.json` থেকে কুকি-মুক্ত অ্যানালিটিক্স অন করার অপশন।
