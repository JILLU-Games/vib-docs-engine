# 020 — `VT-Phase 04` Implementation Plan & Scope Lock

**Date:** `2026-11-18`
**Phase:** `VT-Phase 04` — `Vib Docs Engine` `.vibtools/` & `config.docs.json` Schema Docs + Governance Sync
**Strict Scope Lock:**
- `docs/vibtools-config.md` *(new)*
- `docs/adding-projects.md`
- `docs/index.md`
- `docs/deployment.md`
- `docs/MANIFEST.md`
- `MANIFEST.md` (root)
- `src/MANIFEST.md`
- `src/utils/MANIFEST.md`
- `project/04-codebase-reference.md`
- `project/CHANGELOG.md`
- `notes/016-vibtools-phase-execution-tracker.md`, `notes/018-vibtools-actual-implementation-matrix.md`, `notes/020-vt-phase-04-plan.md`
- *(Untouched: all application runtime source code — `src/layouts/*`, `src/components/*`, `src/pages/*`, `src/utils/*.ts`, `scripts/*`, `functions/*`, `src/styles/*`, `config/*`)*

---

## 1. Inspected Files

- `src/utils/vibtoolsConfig.ts` (authoritative schema & rules)
- `scripts/sync-docs.mjs`, `scripts/add-project.mjs`, `scripts/verify-build.mjs`
- `docs/index.md`, `docs/adding-projects.md`, `docs/deployment.md`, `docs/MANIFEST.md`
- `MANIFEST.md`, `src/MANIFEST.md`, `src/utils/MANIFEST.md`
- `project/04-codebase-reference.md`, `project/CHANGELOG.md`
- `notes/015-vibtools-roadmap-and-scope-locks.md`, `notes/016-vibtools-phase-execution-tracker.md`, `notes/018-vibtools-actual-implementation-matrix.md`

---

## 2. Small Implementation Steps

1. **Create `docs/vibtools-config.md`:**
   - Complete `.vibtools/` standard reference rendered directly inside the live `Vib Docs Engine` site (`/vib-docs-engine/vibtools-config/`).
   - Document canonical `docs.config.json` and supported `config.docs.json` alias (plus conflict rule: never commit both simultaneously).
   - Provide exact field-by-field schema table (`schemaVersion`, `docsType`, `targets.users`, `targets.developer`, `slug`, `title`, `category`, `description`, `version`, `accentColor`, `docsPath`, `logoPath`, `ctaLabel`, `ctaUrl`, `branch`), metadata precedence chain, Smart Markdown fallback rules, `.vibtools/logo.{svg,png}` discovery & `< 2 MB` / static-SVG safety rules, and complete copy-paste templates (User-only, Developer-only, Dual-Portal single-repo, bare `repoUrl`-only registry, and JSON Schema block).
2. **Update `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`:**
   - Elevate the `.vibtools/` + bare `repoUrl`-only onboarding and `npm run add-project -- --url <repoUrl>` CLI as the recommended primary workflow, linking cleanly to `vibtools-config.md` so internal Astro remark link rewriting produces `/vib-docs-engine/vibtools-config/`.
   - Document `portalType` (`"users"` / `"developer"` / `"all"`) in `config/site.config.json` and dual-domain routing (`docs.vib.tools` vs `developer.vibtools.io`) inside `docs/deployment.md`.
3. **Sync Inventories & Project Governance:**
   - Update `docs/MANIFEST.md`, root `MANIFEST.md` (adding `.vibtools/`), `src/MANIFEST.md`, `src/utils/MANIFEST.md`, `project/04-codebase-reference.md`, and `project/CHANGELOG.md`.
   - Update `notes/016`, `notes/018`, and `notes/020`.
4. **Build, Verify, & Live Browser Inspection:**
   - Run `compile_applet`, `lint_applet`, `node scripts/verify-build.mjs`, `npx --yes tsx --test src/utils/*.test.ts`.
   - Restart dev server if needed (`predev` sync) and inspect `/vib-docs-engine/vibtools-config/` (Dark & Light + Console) using `playwright-cli` (`computer-use` skill).

---

## 3. Progress Log *(Updated During Execution)*

- [x] Plan created before docs/governance edits.
- [x] `docs/vibtools-config.md` created & existing `docs/*.md` updated (including clean directory tree line fit).
- [x] `MANIFEST.md` files & `project/*` synced.
- [x] Final build, lint, unit tests, `verify-build.mjs`, & headless Chromium verification completed (`7` HTML pages, `0` console errors/warnings).
