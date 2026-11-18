# 015 — `.vibtools/` All-in-One Config & Dual-Portal Roadmap (`VT-Phase 01` – `VT-Phase 04`)

**Date:** `2026-11-18`
**Prerequisite Baseline:** `notes/014-vibtools-baseline-freeze-and-forensic-audit.md`
**Goal:** Enable zero-boilerplate `repoUrl`-only onboarding powered by root `.vibtools/docs.config.json` (plus `.vibtools/config.docs.json` alias), dual `users` / `developer` portal targeting, `.vibtools/` logo resolution, and complete `Vib Docs Engine` docs/schema guides across 4 strictly scope-locked phases.

---

## 1. Phase Roadmap Overview

| Phase | Target Objective | Audit IDs | Strictly Locked Files | Untouched Guarantees |
| :--- | :--- | :--- | :--- | :--- |
| **VT-Phase 01** | Pure `.vibtools/` Zod Schema, Dual-Target Resolver, Smart Markdown Extractor, & `portalType` Config | `VT-AUDIT-01`, `VT-AUDIT-02`, `VT-AUDIT-04` | `src/utils/vibtoolsConfig.ts` *(new)*, `src/utils/vibtoolsConfig.test.ts` *(new)*, `src/utils/manifest.ts`, `config/site.config.json`, `config/presets/user-portal/site.config.json`, `config/presets/dev-portal/site.config.json` | All Astro UI (`src/layouts/*`, `src/components/*`, `src/pages/*`), CSS, `scripts/*`, Cloudflare Functions, `docs/*` |
| **VT-Phase 02** | Two-Step Git Sparse Checkout, `.vibtools/` Discovery (`docs.config.json` & `config.docs.json`), `portalType` Filtering, & Logo Resolution | `VT-AUDIT-02`, `VT-AUDIT-03`, `VT-AUDIT-04` | `scripts/sync-docs.mjs` | All Astro layouts/components/pages, CSS, `scripts/add-project.mjs`, `scripts/verify-build.mjs`, `docs/*` |
| **VT-Phase 03** | `repoUrl`-Only CLI Flow, Engine Self-`.vibtools/`, Preset Updates, & Verifier Checks | `VT-AUDIT-05` | `scripts/add-project.mjs`, `scripts/verify-build.mjs`, `.vibtools/docs.config.json` *(new)*, `.vibtools/logo.png` *(new)*, `config/presets/user-portal/projects.json`, `config/presets/dev-portal/projects.json` | All Astro UI/pages/SEO routes, CSS, `functions/*`, `src/utils/*` |
| **VT-Phase 04** | Full `Vib Docs Engine` `.vibtools/` & `config.docs.json` Schema Docs + Durable Project Governance Sync | `VT-AUDIT-06` | `docs/vibtools-config.md` *(new)*, `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`, `docs/MANIFEST.md`, `MANIFEST.md`, `src/MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md` | Application runtime code (`src/layouts/*`, `src/components/*`, `src/pages/*`, `scripts/*`, `functions/*`) |

---

## 2. Detailed Per-Phase Scope Lock & Patch Blueprints

### VT-Phase 01 — Pure `.vibtools/` Schema, Dual-Target Resolver, Smart Markdown Extractor & `portalType`
- **Why First:** Decouples validation, path-traversal safety, `users`/`developer` target selection, `config/projects.json` string-or-object normalization, and Markdown fallback parsing into a pure TypeScript module tested via `node:test` before touching Git sync scripts.
- **Exact File Locks:**
  1. `src/utils/vibtoolsConfig.ts` *(new)*:
     - Define `PORTAL_TYPES = ["users", "developer", "all"]`, `VIBTOOLS_DIR = ".vibtools"`, `VIBTOOLS_CONFIG_FILES = ["docs.config.json", "config.docs.json"]`.
     - Export `vibtoolsRepoConfigSchema` (Zod):
       - Root optional/shared fields: `schemaVersion` (`1`), `docsType` (`"users" | "developer" | "both"`), `slug`, `title`, `category`, `description`, `version`, `accentColor`, `docsPath`, `logoPath`, `ctaLabel`, `ctaUrl`, `branch`.
       - Optional `targets?: { users?: TargetFields; developer?: TargetFields }` where each target can override `slug`, `title`, `category`, `description`, `version`, `accentColor`, `docsPath`, `logoPath`, `ctaLabel`, `ctaUrl`, `branch`.
       - Relative path guard on `docsPath` and `logoPath` (no leading `/`, no `\`, no `..` traversal, no `.` alone for `docsPath`).
     - Export `normalizeRegistryEntry(rawEntry)`: converts `"https://github.com/org/repo.git"` -> `{ repoUrl: "https://github.com/org/repo.git", branch: "main" }` and passes objects through cleanly.
     - Export `resolvePortalProjectConfig({ portalType, registryEntry, remoteConfig, fallbackDefaults })`:
       - If `remoteConfig` targets a different portal (e.g., `portalType === "users"` and `remoteConfig` only defines `developer`), returns `{ matched: false, reason }`.
       - Merges priority: `registryEntry` explicit overrides > `remoteConfig.targets[portalType]` > `remoteConfig` root > `fallbackDefaults` (`branch: "main"`, `docsPath: "docs"`, `accentColor: site.defaultAccent`).
       - Enforces final required `slug` + `category` + `accentColor` (derives fallback `slug` cleanly from repo name if omitted in URL-only mode only when `.vibtools/` is absent, or validates provided `slug`).
     - Export `extractMarkdownMetadata(markdownBody)`:
       - Extracts clean `title` (strips common doc suffixes like ` — User Documentation` / ` - Docs` optional helper `stripDocSuffix` vs full H1), first plain-text paragraph `description` (strips Markdown bold/code/links, capped neatly at `~160` chars), and semantic `version` (`v1.0.2` / `Version: 1.0.2` regex).
  2. `src/utils/vibtoolsConfig.test.ts` *(new)*:
     - `node:test` coverage for:
       - Single `docsType: "users"` vs `"developer"` matching & skipping (`portalType`).
       - Dual `targets: { users, developer }` resolution from one config.
       - Registry override precedence (`projects.json` overrides `.vibtools/`).
       - String-form `"https://..."` normalization in `projects.json`.
       - Rejection of `..` path traversal in `docsPath` / `logoPath` and invalid `slug` / `accentColor`.
       - `extractMarkdownMetadata` on the real `CalGrid` Markdown sample (`title`, first-paragraph `description`, `v1.0.2` -> `1.0.2`).
  3. `src/utils/manifest.ts`:
     - Add `portalType?: "users" | "developer" | "all"` to `SiteConfig`.
  4. `config/site.config.json`, `config/presets/user-portal/site.config.json`, `config/presets/dev-portal/site.config.json`:
     - Add `"portalType": "all"` (root default `config/site.config.json` or `"developer"`/`"all"`), `"portalType": "users"` (`user-portal`), `"portalType": "developer"` (`dev-portal`).
- **Exact Patch Proof Preview (`src/utils/manifest.ts:48-56`):**
  ```ts
  export interface SiteConfig {
    portalTitle: string;
    portalSubtitle: string;
    domain: string;
    brandName: string;
    brandLogo: string;
    defaultAccent: string;
    portalType?: "users" | "developer" | "all";
    navLinks: Array<{ label: string; href: string }>;
  }
  ```
- **Verification Check:** `npx --yes tsx --test src/utils/vibtoolsConfig.test.ts src/utils/seo.test.ts src/utils/search.test.ts`, `compile_applet`, `lint_applet`.

---

### VT-Phase 02 — Two-Step Git Sparse Checkout & `.vibtools/` Engine Integration
- **Why Second:** Integrates the already-tested pure `.vibtools/` resolver into `scripts/sync-docs.mjs` while preserving 100% backward compatibility for repositories without `.vibtools/`.
- **Exact File Locks:**
  1. `scripts/sync-docs.mjs`:
     - Load `./src/utils/vibtoolsConfig.ts` via the existing TypeScript `transpileModule` loader pattern (identical to `loadSidebarBuilder()` at lines `444-455`) — keeps `sync-docs.mjs` zero-build-step Node-runnable without duplicating Zod logic!
     - Extend `siteConfigSchema` (`lines 33-57`) with `portalType: z.enum(["users", "developer", "all"]).default("all")`.
     - Relax `projects` parsing (`lines 573-584`) to accept both repo URL strings (`"https://..."`) and partial objects `{ repoUrl, ...optionalOverrides }` (full validation happens after loading `.vibtools/` config!).
     - Replace single-step `runGitSparseClone` with two-step safe sparse checkout:
       1. `cloneBaseRepo(cloneUrl, branch, destination)`: `git clone --depth 1 --filter=blob:none --no-checkout --branch <branch> <cloneUrl> <destination>` (or `--sparse` + `git sparse-checkout set .vibtools` when checking remote), then checkout `.vibtools` (`git sparse-checkout set .vibtools` && `git checkout`). Also works cleanly for local paths (`localPath` / `vib-docs-engine` self-fallback) by reading `.vibtools/` directly!
       2. Read `.vibtools/docs.config.json` (or `.vibtools/config.docs.json` fallback alias; reject clearly if *both* exist with conflicting content or invalid JSON).
       3. Call `resolvePortalProjectConfig({ portalType: siteConfig.portalType, registryEntry, remoteConfig })`. If `matched === false`, return `null` from `syncProject` and log `Skipped <id> (<reason>)` cleanly without throwing!
       4. Validate resolved `docsPath` & optional `logoPath` with `assertWithin`, add sparse path (`git sparse-checkout add <resolvedDocsPath>` and `<logoParentDir>` if outside `.vibtools` & `docsPath`) and `git checkout`.
     - Enhance `findLogo(sourceDirectory, project, vibtoolsDirectory, configuredLogoPath)`:
       - Priority: explicit `configuredLogoPath` (validated inside checkout root, no symlinks, `< 2 MB`, PNG signature / safe SVG check) -> `.vibtools/logo.{svg,png}` -> `<docsPath>/logo.{svg,png}`, `icon.{svg,png}`, `assets/*`, `images/*`.
     - Enhance title/description/version resolution (`lines 500-515`) using `extractMarkdownMetadata` as fallback after frontmatter -> `.vibtools/` / `projects.json` overrides.
     - Preserve `skippedCount` tracking in `main()` so if all configured entries were legitimately skipped for `portalType` vs failed with errors, clear diagnostics print without leaking secrets.
- **Verification Check:**
  - `npm run sync && npm run verify`
  - Isolated local temp fixture test (with fake `.vibtools/docs.config.json` containing dual `targets.users` + `targets.developer` and `.vibtools/config.docs.json` alias, verifying both `users` and `developer` resolution + symlink/traversal rejection)
  - `compile_applet` + `lint_applet`

---

### VT-Phase 03 — Minimal CLI, Verifier Guardrails, Presets & Self-Repo `.vibtools/`
- **Why Third:** Updates operator entrypoints (`add-project.mjs`, `verify-build.mjs`, presets) and dogfoods `.vibtools/` directly inside `vib-docs-engine` itself once `sync-docs.mjs` is verified working.
- **Exact File Locks:**
  1. `.vibtools/docs.config.json` *(new)* + `.vibtools/logo.png` *(new, copied from `public/apple-touch-icon.png`)*:
     - Configure `vib-docs-engine` as `"docsType": "developer"`, `"slug": "vib-docs-engine"`, `"category": "Core Engine"`, `"docsPath": "docs"`, `"logoPath": ".vibtools/logo.png"`, `"version": "0.1.0"`.
  2. `scripts/add-project.mjs`:
     - Add fast `--url <repoUrl>` or interactive mode supporting **`.vibtools/` Auto mode** (save minimal `{ repoUrl }` or URL string when user confirms repo uses `.vibtools/`, OR full fields when manual overrides are desired), without breaking existing interactive validation.
  3. `scripts/verify-build.mjs`:
     - Validate `.vibtools/docs.config.json` (or `config.docs.json`) syntax & schema if present in `projectRoot/.vibtools/`.
     - Ensure `export-portal.mjs` keeps working cleanly (remember `.vibtools/` is NOT excluded unless needed—actually `.vibtools/` in `vib-docs-engine` stays clean, or `export-portal` preserves it).
  4. `config/presets/user-portal/projects.json` & `config/presets/dev-portal/projects.json`:
     - Showcase clean compact `.vibtools/` style entry for `vib-docs-engine` in `dev-portal` (`"https://github.com/JILLU-Games/vib-docs-engine.git"`) alongside clear example entries.
- **Verification Check:** `npx --yes tsx --test src/utils/*.test.ts`, `npm run verify`, `export-portal` smoke test for both `user` and `dev` portals, `compile_applet`, `lint_applet`.

---

### VT-Phase 04 — `Vib Docs Engine` `.vibtools/` & `config.docs.json` Documentation + Governance Sync
- **Why Last:** Document only exact, verified implemented schema, behavior, file names, and CLI options in `docs/` (`Vib Docs Engine` live docs site!) and `project/` after all code tests pass.
- **Exact File Locks:**
  1. `docs/vibtools-config.md` *(new — appears automatically in Vib Docs Engine sidebar!)*:
     - Complete guide for `.vibtools/` standard (`docs.config.json` primary + `config.docs.json` supported alias + `.vibtools/logo.svg`/`.png`).
     - Exact JSON Schema / field-by-field table (`schemaVersion`, `docsType`, `targets.users`, `targets.developer`, `slug`, `title`, `category`, `description`, `version`, `accentColor`, `docsPath`, `logoPath`, `ctaLabel`, `ctaUrl`, `branch`).
     - Priority order diagram (`projects.json` override -> `.vibtools/` target -> `.vibtools/` root -> Markdown frontmatter -> Smart Markdown fallback).
     - Complete copy-paste examples for: (a) User-only repo, (b) Developer-only repo, (c) Single repo serving BOTH `docs.vib.tools` (`users`) + `developer.vibtools.io` (`developer`), and (d) Minimal `repoUrl`-only `config/projects.json`.
     - Security & validation rules (no `..` path traversal, no symlinks, static SVG sanitization, `< 2 MB` logo).
  2. `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`:
     - Make `.vibtools/` + `repoUrl`-only onboarding the primary recommended workflow, linking directly to `vibtools-config.md` (`docs/vibtools-config.md`), while documenting legacy `config/projects.json` as optional override/fallback.
  3. `docs/MANIFEST.md`, `MANIFEST.md` (root), `src/MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/016`–`018`:
     - Sync all inventories, module references, test/verify results, and execution logs.
- **Verification Check:** `compile_applet`, `lint_applet`, `npm run verify` (confirming `/vib-docs-engine/vibtools-config/` HTML, `.md`, `llms.txt`, `llms-full.txt`, JSON-LD, Pagefind search), and Chromium live check reading the new `Vib Docs Engine` docs page!

---

> **Bangla Summary (রোডম্যাপ ও স্কোপ লক):** পুরো `.vibtools/` আপডেটটি **৪টি ফেজে (`VT-Phase 01` – `VT-Phase 04`)** ভাগ করা হলো। Phase 01-এ pure Zod schema ও resolver + unit test, Phase 02-এ `sync-docs.mjs` 2-step sparse checkout + `portalType` filtering, Phase 03-এ CLI/Verifier/Engine `.vibtools/`, এবং Phase 04-এ `Vib Docs Engine`-এর লাইভ ডকস (`docs/vibtools-config.md` সহ `docs.config.json` / `config.docs.json` পুরো schema ও গাইডলাইন) যুক্ত করা হবে।
