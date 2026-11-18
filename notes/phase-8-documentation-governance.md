# Phase 8: Documentation Governance

Date: 2026-11-17

## Goal

Establish repository instructions and accurate, navigable documentation inventories without changing application behavior. Keep the notes folder development-only; make `project/` and `docs/` the durable, tracked knowledge bases.

## Inspected baseline

- No root `AGENTS.md` existed.
- Root `README.md` existed; no `README.md` or `MANIFEST.md` files were found elsewhere at the start.
- `project/` already contains vision, architecture, feature/workflow, and UI design specs.
- `docs/` already contains operator guides and is also the local sync fixture source.
- Generated/dependency folders exist (`dist/`, `.astro/`, `node_modules/`); do not place governance files there.

## Plan

1. Add repository-wide `AGENTS.md` rules requiring a notes plan before changes and synchronized project/docs records after changes.
2. Inventory authored source/config folders and add concise local `README.md` and `MANIFEST.md` guides; explicitly exclude generated/vendor folders and `src/content/docs/`.
3. Add a verified codebase reference and chronological change log in `project/`.
4. Add exact user/operator usage guidance in `docs/`, based on implemented components and scripts.
5. Update root README navigation and exclude `notes/` from exported portal repositories.
6. Validate Markdown/JSON inventories and run applicable TypeScript/Astro verification without altering generated content unnecessarily.

## Execution log

- 2026-11-17: Began repository inventory. Confirmed no existing `AGENTS.md`; created the development notes directory and this plan before further edits.
- 2026-11-17: Follow-up inventory found authored source directories still needing local README/MANIFEST indexes: `scripts/`, `templates/`, `public/`, `src/`, `src/components/` and its four groups, `src/content/`, `src/layouts/`, `src/pages/` and `[product]/`, `src/styles/`, and `src/utils/`. Generated children (`src/content/docs/`, `src/generated/`, and `public/logos/`) stay documentation-free because sync/export owns their contents.
- 2026-11-17: Next plan: confirm the empty `docs/images/` test directory, exclude `notes/` from `scripts/export-portal.mjs`, add the remaining folder indexes and root MANIFEST, update the README and codebase reference/changelog, then run static diagnostics and a portal-export smoke test.
- 2026-11-17: Confirmed `docs/images/` is empty and is a leftover from a temporary nested-image test. Remove the empty untracked folder instead of placing Markdown in the product-docs source tree, where it would become published navigation pages.
- 2026-11-17: Removed the empty test folder, excluded `notes/` from portal exports, and added root/source folder README/MANIFEST files plus a verified code map and portal-user guide.
- 2026-11-17: Next validation: inventory every authored directory's README/MANIFEST, run TypeScript/Astro checks, and confirm the exporter excludes notes while preserving generated-folder `.gitkeep` files.
- 2026-11-17: Initial inventory counted 23 directories before applying Astro route-folder exceptions. The first PowerShell check treated `[product]` as a wildcard; literal-path checking corrected that result. Final coverage is 21 tracked non-routable authored folders; `src/pages/` and `src/pages/[product]/` are parent-documented exceptions because Markdown there becomes routes.
- 2026-11-17: Exporter smoke test passed with the user preset; it preserved README/MANIFEST and `.gitkeep`, and excluded `notes/`, generated files, and presets. TypeScript and Astro sync passed.
- 2026-11-17: Expanded `project/04-codebase-reference.md` with verified function responsibilities and dependency/setup rationale.
- 2026-11-17: Root README and docs manifest were reconciled with current phases; function/dependency detail and phase-8 changelog were completed.
- 2026-11-17: Added the detailed function/dependency map, updated README/changelog, and completed authored-folder README/MANIFEST inventories. A local `npm run verify` initially revealed that Markdown indexes inside `src/pages/[product]/` become Astro routes. Removed those four files and documented the necessary route-folder exception in `AGENTS.md`, `src/README.md`, `src/MANIFEST.md`, and the project reference.
- 2026-11-17: Final `npm run verify` passed after the route-folder correction: 8 HTML files, 6 required assets, one project, and zero broken internal links. Restored `config/projects.json` to the remote-only project record. `npx tsc --noEmit` and `npx astro sync` also passed.
- 2026-11-17: Portal-user docs, root navigation, folder inventories, and the project changelog were updated. Generated/vendor directories and Astro route directories are explicitly documented exceptions.
- 2026-11-17: New GitHub documentation pass: use the supplied company/author context to add factual project name/tagline/SEO description and public contacts, audit stale phase language in specs, and add contribution/security guidance without inventing license or executive-title claims.
- 2026-11-17: New documentation task: audit all authored Markdown and the supplied Vib Tools author context; rewrite the GitHub README with verified project metadata/features/contacts, add concise contribution/security guidance, and correct stale phase statements in architecture/UI specs. Do not invent a license, legal title, product status, ranking guarantee, or other unsupported claim.

## 2026-11-18 forensic continuation plan

- Inspected session `0aec70d2-308b-488e-b4e1-6844488fa80d`: turns 0-10 cover Phases 1-7, repository governance, and a GitHub README/contribution/security pass; turn 11 closed without an assistant result.
- Verified the project state: root README, CONTRIBUTING, SECURITY, project specs, and changelog contain the requested core GitHub documentation. The remaining GitHub-ready gap is discoverable submission templates because no `.github/` directory exists.
- Inspected the supplied Vib Tools master context and retained only verified organization identity, public contacts, and safe author wording.
- Implementation steps: add bug-report and feature-request issue forms plus a pull-request template, add `.github/README.md` and `MANIFEST.md` inventory guidance, then update durable docs and the changelog.
- Verification: static Markdown inventory, `npx tsc --noEmit`, `npm run verify`, and a final secret/unsupported-claim scan.
- 2026-11-18: Added `.github/` README/MANIFEST, bug-report and feature-request issue forms, private security routing, and a pull-request template. Updated root MANIFEST, CONTRIBUTING guidance, and project changelog. Template file existence and required safe-submission text were validated.
- 2026-11-18 verification: `npx tsc --noEmit` passed. Public-config and secret-like-token checks passed; `config/projects.json` was restored unchanged to its remote repository. `npm run verify` could not authenticate to `https://github.com/JILLU-Games/vib-docs-engine.git`; the repository is currently inaccessible without credentials. A temporary local fixture attempt was terminated during prebuild and its config was restored. Existing artifact verification could not find `src/generated/manifest.json` because sync did not complete. No implementation defect was demonstrated by the documentation-only continuation.
