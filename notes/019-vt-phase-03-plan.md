# 019 — `VT-Phase 03` Implementation Plan & Scope Lock

**Date:** `2026-11-18`
**Phase:** `VT-Phase 03` — Minimal CLI, Verifier Guardrails, Presets & Self-Repo `.vibtools/`
**Strict Scope Lock:**
- `.vibtools/docs.config.json` *(new)*
- `.vibtools/logo.png` *(new)*
- `scripts/add-project.mjs`
- `scripts/verify-build.mjs`
- `config/presets/user-portal/projects.json`
- `config/presets/dev-portal/projects.json`
- *(Untouched: all Astro layouts/components/pages, CSS, `src/utils/*`, `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `functions/*`, `docs/*`)*

---

## 1. Inspected Files

- `notes/015-vibtools-roadmap-and-scope-locks.md`
- `notes/016-vibtools-phase-execution-tracker.md`
- `notes/017-vibtools-error-handling-inventory.md` (`VT-EH-08`)
- `notes/018-vibtools-actual-implementation-matrix.md`
- `src/utils/vibtoolsConfig.ts`
- `scripts/add-project.mjs`
- `scripts/verify-build.mjs`
- `scripts/sync-docs.mjs`
- `scripts/export-portal.mjs`
- `config/projects.json`
- `config/presets/user-portal/projects.json`
- `config/presets/dev-portal/projects.json`
- `docs/index.md`

---

## 2. Small Implementation Steps

1. **Create engine root `.vibtools/` fixture (`.vibtools/docs.config.json` + `.vibtools/logo.png`):**
   - Copy `public/vib-tools-logo.png` (`180x180` PNG) to `.vibtools/logo.png`.
   - Author `.vibtools/docs.config.json` with `schemaVersion: 1`, `docsType: "developer"`, `slug: "vib-docs-engine"`, `title: "Vib Docs Engine"`, `category: "Core Engine"`, `description: "A static multi-product documentation engine."`, `version: "0.1.0"`, `accentColor: "#7C3AED"`, `docsPath: "docs"`, `logoPath: ".vibtools/logo.png"`, `branch: "main"`, `ctaLabel: "View repository"`, `ctaUrl: "https://github.com/JILLU-Games/vib-docs-engine"`.
2. **Update `scripts/add-project.mjs` (`VT-EH-08` + zero-boilerplate `.vibtools/` mode):**
   - Load `src/utils/vibtoolsConfig.ts` via TypeScript `transpileModule` (identical to `sync-docs.mjs`) so CLI validation shares the exact canonical schema/slug/URL checks.
   - Add `--url <repoUrl>` non-interactive CLI mode (with optional `--slug`, `--category`, `--branch`, `--accent`, `--docs-path`, `--docs-type`, `--secret-key`, `--git-username`, `--cta-label`, `--cta-url`) supporting minimal bare-string output when no overrides/auth are passed.
   - Add interactive Mode `[1] .vibtools/ Auto (repoUrl only)` vs `[2] Manual / Custom overrides`.
   - Enforce `VT-EH-08` duplicate `repoUrl` protection (normalized repo comparison; rejected unless an explicit distinct `slug` override is provided) and duplicate resolved slug check across both bare URL strings and object entries.
3. **Update `scripts/verify-build.mjs` (`VT-EH-08` + root `.vibtools/` verification):**
   - Validate `.vibtools/` when present in `projectRoot` (no symlink, reject simultaneous `docs.config.json` + `config.docs.json`, validate JSON via `parseVibtoolsRepoConfig`, confirm `docsPath` directory and optional `logoPath` file `< 2 MB` exist inside `projectRoot`).
   - Validate `config/projects.json` entries via `normalizeRegistryEntry` (rejecting duplicate `repoUrl` entries without distinct explicit `slug` overrides) and validate optional `portalType` in `config/site.config.json`.
4. **Update `config/presets/user-portal/projects.json` and `config/presets/dev-portal/projects.json`:**
   - Update `dev-portal/projects.json` to showcase `"https://github.com/JILLU-Games/vib-docs-engine.git"` in bare `repoUrl` `.vibtools/` format plus a compact `developer` override example.
   - Update `user-portal/projects.json` to showcase compact `users` `.vibtools/` entries (`invio` minimal override + `"https://github.com/YOUR_ORG/inboxchecker.git"` bare URL string).
5. **Verify & Update Documentation:**
   - Run `npm run sync`, `compile_applet`, `lint_applet`, `node scripts/verify-build.mjs`, unit tests, isolated CLI `add-project.mjs` `--url` tests (including duplicate guard), and `export-portal` smoke exports for `user` and `dev` portals (verifying `npm run sync` inside exported staging directories).
   - Update `notes/016`, `notes/018`, `project/04-codebase-reference.md`, and `project/CHANGELOG.md`.

---

## 3. Progress Log *(Updated During Execution)*

- [x] Plan created before code edits.
- [x] `.vibtools/docs.config.json` & `.vibtools/logo.png` created.
- [x] `scripts/add-project.mjs` updated & CLI-tested (`--url`, interactive Mode 1/2, duplicate `repoUrl`/slug & credential rejection).
- [x] `scripts/verify-build.mjs` updated & verified (root `.vibtools/` validation + `config/projects.json` duplicate/schema check).
- [x] Presets updated & `export-portal` smoke-tested for both `user` and `dev` portals (`2/2` products synced in each).
- [x] Final build, lint, tests & durable docs updated (`npm run sync`, `verify-build.mjs`, `tsx --test`, `compile_applet`, `lint_applet`).
