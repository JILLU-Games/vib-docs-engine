# 017 — Error Handling Inventory & `.vibtools/` Hardening Plan

**Date:** `2026-11-18`
**Scope:** Verified active error handling across `vib-docs-engine` (post-SEO & Branding fixes) + planned error guards for `.vibtools/` & dual-portal sync (`VT-Phase 01`–`04`).

---

## 1. Existing Active Error Handling (Baseline `2026-11-18`)

| Layer | File | Active Safeguard | Failure Behavior |
| :--- | :--- | :--- | :--- |
| **Config & Sync** | `scripts/sync-docs.mjs` | Zod validation (`siteConfigSchema`, `projectSchema`), `assertWithin` path containment, symlink rejection, `draft` boolean frontmatter check, `sanitizeError` secret redaction, per-project isolation, empty-manifest guard | Fails fast with redacted secret output; falls back to local `./docs` only for `vib-docs-engine` / `YOUR_ORG` starter placeholders |
| **Brand & Assets** | `scripts/sync-docs.mjs`, `scripts/verify-build.mjs`, `src/layouts/HubLayout.astro` | PNG 8-byte signature check, SVG `<script>` / `on*=` / external `href`/`src` block, `2 MB` size limit, `verify-build.mjs` check on `brandLogo`, `webmanifest` icons, `img[src]`, and `link[rel*="icon"]` | Rejects unsafe logos silently to monogram; `verify-build.mjs` exits `1` on missing `dist/` brand/icon assets |
| **SEO & AI Search** | `src/utils/seo.ts`, `src/utils/llms.ts`, `scripts/verify-build.mjs` | `safeJsonLdStringify` HTML escape (`<`, `>`, `&`, `\u2028`, `\u2029`), protocol-safe `resolveOrigin`, `llms.ts` missing-file/empty-body guard, build verifier `JSON.parse()` on every JSON-LD tag + `404.html` `noindex` + `.md` parity check | Prevents JSON-LD XSS breakout; fails build on malformed JSON-LD or missing `.md`/`llms-full.txt` |
| **CLI & Exporter** | `scripts/add-project.mjs`, `scripts/export-portal.mjs` | Duplicate slug block, `validateRemote` credential rejection, `validateDocsPath` traversal check, paired CTA enforcement, atomic temp-file rename, `isWithin` recursive copy guard | Refuses invalid input or existing target dir before mutating files |
| **Search UI & Edge** | `src/components/ui/SearchModal.astro`, `functions/api/*` | Same-origin `safeResultUrl`, `?q=` capped at `120` chars, `history.replaceState` `try/catch`, `localStorage` `try/catch`, HMAC-SHA256 timing-safe webhook verification, `405`/`502`/`500` structured JSON | Displays clean inline fallback state; never leaks tokens or crashes in sandboxed iframes |

---

## 2. Planned Error Handling Additions for `.vibtools/` (`VT-Phase 01`–`04`)

| Guard ID | Target Module | Risk If Unhandled | Planned Safe Handling | Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| **`VT-EH-01`** | `src/utils/vibtoolsConfig.ts` | Upstream `.vibtools/docs.config.json` or `config.docs.json` contains malformed JSON, unknown `docsType`, invalid `slug`, or non-hex `accentColor` | Strict `Zod` schema parse with clear file-scoped error (`Invalid .vibtools/docs.config.json in <repo>: <field>: <msg>`) isolating only that repo | **VT-Phase 01 & 02** |
| **`VT-EH-02`** | `scripts/sync-docs.mjs` | A repository contains BOTH `.vibtools/docs.config.json` AND `.vibtools/config.docs.json` (conflicting sources of truth) or neither | Prefer `docs.config.json` only if unambiguous; if BOTH exist simultaneously, throw an explicit error asking operator to keep one canonical filename; if neither exists, fall back cleanly to legacy `projects.json` fields | **VT-Phase 02** |
| **`VT-EH-03`** | `src/utils/vibtoolsConfig.ts` & `scripts/sync-docs.mjs` | Malicious or accidental `docsPath: "../../etc"` or `logoPath: "/etc/passwd"` in a remote repo config escapes checkout directory | Enforce relative-only path schema (no leading `/`, no `\`, no `..` segments), verify `assertWithin(checkoutRoot, resolvedPath)`, and reject symbolic links via `fs.lstat` | **VT-Phase 01 & 02** |
| **`VT-EH-04`** | `scripts/sync-docs.mjs` | In 2-step sparse checkout, `.vibtools` does not exist in an older repo or `docsPath` resolved from `.vibtools` is missing in that branch | Handle missing `.vibtools` during sparse step gracefully (fallback to legacy `docsPath` checkout); fail only that project with clear missing-directory error if resolved `docsPath` does not exist | **VT-Phase 02** |
| **`VT-EH-05`** | `src/utils/vibtoolsConfig.ts` & `scripts/sync-docs.mjs` | On `docs.vib.tools` (`portalType: "users"`), a developer-only repo in the shared list is treated as a build failure or incorrectly published to end-users | Return `{ matched: false }` when `portalType` does not match `.vibtools/` `docsType`/`targets`; log clean `Skipped <repo> (developer-only)` info without failing build; still fail if `0` projects match AND errors occurred | **VT-Phase 01 & 02** |
| **`VT-EH-06`** | `scripts/sync-docs.mjs` | Two different `repoUrl` entries resolve to the same `slug` inside `.vibtools/docs.config.json` (silent overwrite in `src/content/docs/<slug>`) | Track resolved `syncedSlugs` Set *after* `.vibtools/` merge and throw explicit collision error (`Duplicate resolved slug "<slug>" from <repoA> and <repoB>; override one in config/projects.json`) | **VT-Phase 02** |
| **`VT-EH-07`** | `scripts/sync-docs.mjs` | Custom `logoPath` points to missing file, `> 2 MB`, corrupt PNG, or `<script>` SVG | Validate with `findLogo()` security checks; emit clean warning and fall back cleanly to monogram badge instead of failing docs build or shipping unsafe SVG | **VT-Phase 02** |
| **`VT-EH-08`** | `scripts/verify-build.mjs` & `scripts/add-project.mjs` | Duplicate `repoUrl` in `config/projects.json` or invalid root `.vibtools/docs.config.json` goes unnoticed before push | Reject duplicate `repoUrl` (unless distinct override `slug` is explicitly set) in `add-project.mjs` and validate root `.vibtools/` JSON schema during `verify-build.mjs` | **VT-Phase 03** |

---

> **Bangla Summary (এরর হ্যান্ডলিং):** প্রজেক্টের বর্তমান সব সুরক্ষা ব্যবস্থার পাশাপাশি `.vibtools/` সিস্টেমের জন্য ৮টি নতুন নিরাপত্তা ও এরর হ্যান্ডলিং (`VT-EH-01` – `VT-EH-08`) নোট করা হলো — যেমন invalid JSON/schema, দ্বৈত ফাইল কনফ্লিক্ট, `..` path traversal / symlink ব্লক, portal mismatch অটো-skip, ডুপ্লিকেট resolved slug ধরা, এবং unsafe লোগো ফাইল গার্ড।
