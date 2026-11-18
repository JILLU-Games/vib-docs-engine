# Engineering Change Log

Record dates, files/areas, behavior changed, and verification result whenever code, configuration, or docs change. This is the durable project history; personal working notes remain under `notes/`.

## 2026-11-17 — Phase 7 QA and documentation governance

- Added `scripts/export-portal.mjs`, portal presets, `scripts/verify-build.mjs`, and `docs/deployment.md` for dual-portal export and go-live validation.
- Verified exporter preset injection/exclusions/keep files and `npm run verify`; build output contained five HTML pages and had no broken internal links.
- Added development-only `notes/` process, root `AGENTS.md`, per-authored-folder README/MANIFEST indexes, and verified codebase reference. Generated/vendor directories remain excluded.
- Added the root `MANIFEST.md` and documented direct source-folder inventories, setup ownership, modules/functions, UI controls, and the development-only notes boundary.
- Added `project/04-codebase-reference.md` function/dependency map and the `docs/portal-user-guide.md`; validated the exporter, TypeScript, and Astro sync after the documentation changes.

## 2026-11-17 — Phase 8 Documentation Governance

- Added root `AGENTS.md` with plan/log-first change rules and durable documentation requirements.
- Added `notes/` planning guidance and an execution log; configured portal export to omit notes.
- Added README/MANIFEST indexes for all tracked non-routable authored folders, a root manifest, portal-user guide, and function/dependency code map.
- Explicitly excluded generated/vendor folders and Astro route directories from local Markdown indexes; Markdown in `src/pages/` would create routes.
- Verified exporter exclusions, `npx tsc --noEmit`, `npx astro sync`, and `npm run verify` (8 HTML pages, 6 required files, one product, no broken internal links). Production config was restored to remote-only.
- Rewrote the GitHub README with verified Vib Tools project/author details, current features and workflows, natural-language SEO summary, and public contact links; added contributor/security reporting guides. No license or executive title was inferred.
- Completed the GitHub-native submission layer with bug-report and feature-request forms, a pull-request template, private vulnerability routing, and `.github/` README/MANIFEST inventories. Updated the root manifest and contributor guidance; no application behavior or generated content was changed.
