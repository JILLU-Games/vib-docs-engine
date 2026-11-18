# 027 — Cloudflare Pages & Functions Forensic Audit

**Audit Date:** `2026-11-18`
**Audited Baseline:** `vib-docs-engine@0.1.0` *(post `REL-Phase 01`–`03`)*
**Scope:** End-to-end forensic review of all Cloudflare Pages & Functions deployment logic — build scripts, Node/lockfile detection, static edge routing/headers/redirects, `functions/api/*` runtime handlers, `wrangler.toml`, `export-portal.mjs` split-portal output, and `verify-build.mjs`.
**Audit Outcome:** Core Cloudflare Pages deployment works, and **9 real edge/runtime/hygiene findings** (`CF2-F01` – `CF2-F09`) were confirmed with exact file/line proof.

---

## 1. Verified Healthy Cloudflare Components (Already Solid)

- `.node-version` (`22.24.0`) & `.nvmrc` (`22.24.0`): satisfies Astro `7.4.12` (`>=22.23.4`).
- `public/_routes.json`: `{ "version": 1, "include": ["/api/*"], "exclude": [] }` — routes only `/api/*` to Functions while keeping all HTML/Pagefind/MD/LLMs traffic on the free static CDN edge.
- `public/_redirects`: clean comment-only starter with zero invalid custom-domain source URLs.
- `functions/tsconfig.json`: isolated strict `WebWorker` + `ES2022` config (`npx tsc -p functions/tsconfig.json --noEmit` exits `0`).
- `functions/api/webhook.ts`: fail-closed `WEBHOOK_SECRET` check (`501` unless `ALLOW_UNAUTHENTICATED_WEBHOOK="true"`), timing-safe direct secret (`X-Webhook-Secret`, `X-Gitlab-Token`, `Authorization: Bearer`), Web Crypto `HMAC-SHA256` verification (`X-Hub-Signature-256`, `X-Gitea-Signature`, `X-Forgejo-Signature`), and `ALLOWED_BRANCHES` support.
- `scripts/verify-build.mjs`: validates `wrangler.toml`, `.node-version`, `.nvmrc`, `functions/*`, `dist/_routes.json`, and `dist/_redirects`.

---

## 2. Verified Forensic Findings (`CF2-F01` – `CF2-F09`)

| ID | Severity | Component / File | Exact Evidence & Code Proof | Impact on Cloudflare Pages Deploy |
| :--- | :--- | :--- | :--- | :--- |
| **`CF2-F01`** | **Medium-High** | `functions/api/health.ts` (`lines 9-40`) | Exports `onRequestGet()` and fallback `onRequest()`, but does **not** export `onRequestHead()`. | Standard uptime monitors (UptimeRobot, BetterStack, Cloudflare Health Checks) send `HEAD /api/health` by default. Pages Functions routes `HEAD` to fallback `onRequest()`, returning **`405 Method Not Allowed`** and falsely marking healthy portals as DOWN. |
| **`CF2-F02`** | **Medium-High** | `functions/api/webhook.ts` (`lines 158-179`) | `parseBranchFromPayload(rawBody)` returns `null` when `ref` is missing; `if (payloadBranch !== null ...)` passes when `null`. No `X-GitHub-Event: ping` or `delete` event check. | 1) Adding the webhook in GitHub immediately sends `POST` with `X-GitHub-Event: ping` (`{"zen": ...}`, no `ref`), **triggering a real Cloudflare Pages deploy on setup**. 2) Non-push or `delete` events without matching guard can trigger unintended builds. |
| **`CF2-F03`** | **Medium** | `functions/api/webhook.ts` (`lines 77-90`) | `parseBranchFromPayload` unconditionally runs `JSON.parse(rawBody)`. | If GitHub webhook Content-Type is configured as `application/x-www-form-urlencoded` (`payload=%7B...%7D`), HMAC verifies on `rawBody`, `JSON.parse` fails silently -> returns `null` -> **`ALLOWED_BRANCHES` filter is silently bypassed**. |
| **`CF2-F04`** | **Medium** | `functions/api/webhook.ts` (`lines 181-204`) | `const hookResponse = await fetch(deployHookUrl, ...)` does not validate `https://` protocol, sets no timeout (`AbortSignal.timeout`), and never drains/cancels `hookResponse.body` (`await hookResponse.body?.cancel().catch(() => {})`). | In Cloudflare Workers runtime, returning without canceling an upstream `fetch` response body logs stalled/unconsumed-body warnings; slow/non-HTTPS `CF_DEPLOY_HOOK_URL` hangs until Worker timeout. |
| **`CF2-F05`** | **Medium** | `public/MANIFEST.md`, `public/README.md` -> `dist/` | `list_dir /dist` confirms `dist/MANIFEST.md` and `dist/README.md` are copied verbatim into the built static root. | Every Cloudflare Pages deploy publicly exposes internal repo developer files at `/MANIFEST.md` and `/README.md` on the live domain. *(Should be moved/omitted from `dist/` or documented outside `public/` — note `AGENTS.md` governs `public/` indexes; check `scripts/verify-build.mjs` / build hook or `AGENTS.md` policy carefully before deciding fix.)* |
| **`CF2-F06`** | **Medium** | `package.json` (`lines 16, 21-23`) + `bun.lock` + `package-lock.json` | 1) `engines.node` is `">=22.0.0"`, while Astro 7 (`node_modules/astro/bin/astro.mjs:31`) enforces `>=22.23.4`. 2) `"build"` unconditionally sets `NODE_OPTIONS="... process.versions.webcontainer='1'"`. 3) Both `bun.lock` (`61 KB`) and `package-lock.json` (`118 KB`) exist at root and in exported portals. | Cloudflare Pages Build v2 gives priority to `bun.lock` and runs `bun install` instead of `npm ci`; if `package.json` changes via `npm` without syncing `bun.lock`, CF Pages installs fail or use stale lock data. Hardcoded `--import data:...webcontainer='1'` also runs `IS_STACKBLITZ=true` unconditionally in CI. |
| **`CF2-F07`** | **Medium** | `wrangler.toml` (`lines 2, 13-15`) & `scripts/export-portal.mjs` | 1) `export-portal.mjs` copies `wrangler.toml` with `name = "vib-docs-engine"` unchanged for both `--portal user` and `--portal dev`. 2) `wrangler.toml` line 14 still says `# - WEBHOOK_SECRET: Optional shared secret` (stale after fail-closed `REL-Phase 02`). | Running `npx wrangler pages deploy dist` in both exported portals collides onto the single Cloudflare Pages project `"vib-docs-engine"`. Stale comment misleads operators into leaving `WEBHOOK_SECRET` unset (`501` runtime error). |
| **`CF2-F08`** | **Low-Medium** | `public/_headers` (`lines 27-37`) & `public/site.webmanifest` | 1) `public/_headers` lacks explicit `Content-Type: application/manifest+json; charset=utf-8` for `/site.webmanifest` and has redundant `/*/*.md` + `/*/*/*.md` rules (while missing root `/*.md` if ever needed). 2) `public/site.webmanifest` hardcodes `user-portal` title `"Vib Tools Documentation"` and `#7C3AED` even when exported for `dev-portal` (`#2563EB`). | Minor PWA metadata mismatch on `developer.vibtools.io` when installed via `site.webmanifest`. |
| **`CF2-F09`** | **Low-Medium** | `scripts/sync-docs.mjs` (`lines 575-588`) & `scripts/verify-build.mjs` | When exported starter `config/projects.json` still contains `YOUR_ORG` placeholders, `npm run build` & `npm run verify` still exit `0` by substituting the engine's `./docs` fixture. | Accidental early Cloudflare Pages deploy before replacing `YOUR_ORG` publishes Vib Docs Engine's docs under `"Invio"` / `"Vib Self-Hosted"` unless an explicit strict check fails or blocks production CI (`CF_PAGES=1` / `--strict`). |

---

## 3. Recommended Scope-Locked Remediation Order *(If User Requests Fixing)*

- **`CF2-Phase 01` (Pages Functions Runtime Safety):** `functions/api/health.ts` (`onRequestHead`), `functions/api/webhook.ts` (`ping`/non-push filter, form-urlencoded `payload=` branch extraction, HTTPS + timeout + `hookResponse.body?.cancel()`).
- **`CF2-Phase 02` (Cloudflare Build, Wrangler & Exporter Parity):** `wrangler.toml` (accurate docs/flags), `scripts/export-portal.mjs` (distinct `wrangler.toml` project name & `site.webmanifest` branding per portal), `package.json` / build wrapper (`>=22.23.4` + lockfile clarity), `public/_headers`.
- **`CF2-Phase 03` (`dist/` Artifact Hygiene & CI Guardrail):** Prevent `public/MANIFEST.md` / `public/README.md` leak into `dist/`, optional `STRICT_SYNC` / `CF_PAGES` `YOUR_ORG` check in `verify-build.mjs`, plus `docs/deployment.md` + `project/*` sync.

---

> **Bangla Summary (ক্লাউডফ্লেয়ার পেজেস ফরেনসিক অডিট):** বর্তমান Cloudflare Pages ও Functions লজিক যাচাই করে **৯টি বাস্তব ফিক্সযোগ্য গ্যাপ (`CF2-F01` – `CF2-F09`)** পাওয়া গেছে — বিশেষ করে `HEAD /api/health` (`405` monitor bug), GitHub `ping` webhook-এ অকারণে বিল্ড ট্রিগার, `x-www-form-urlencoded` payload-এ `ALLOWED_BRANCHES` bypass, `fetch` body cleanup, `public/MANIFEST.md` ও `README.md`-এর `dist/`-এ লিক হওয়া, `bun.lock` vs `package-lock.json` কনফ্লিক্ট, এবং দুটো পোর্টালে `wrangler.toml` নাম (`vib-docs-engine`) এক থেকে যাওয়া।
