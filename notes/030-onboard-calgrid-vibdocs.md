# 030 — Audit & Onboard `https://github.com/vibdocs/CalGrid` for `docs.vib.tools`

**Date:** `2026-11-19`
**Goal:** Inspect the newly created public docs-only repository `https://github.com/vibdocs/CalGrid`, verify its `.vibtools/docs.config.json` and `docs/` tree against all Vib Docs Engine rules, register it in `config/projects.json` and `config/presets/user-portal/projects.json` for `https://docs.vib.tools`, and run the full build + link/asset verifier.

---

## 1. Inspected Files & Remote Repository Audit

- Remote repository: `https://github.com/vibdocs/CalGrid.git` (`HEAD` -> `main`, commit `2c71cf077ac7f1885a92d09fee0aaeb2b93adde9`)
- `.vibtools/docs.config.json`:
  - `$schema`: `"https://docs.vib.tools/schemas/vibtools-docs.schema.json"`
  - `schemaVersion`: `1`
  - `docsType`: `"users"`
  - `slug`: `"calgrid"`
  - `title`: `"CalGrid"`
  - `category`: `"Desktop Apps"`
  - `version`: `"1.0.2"`
  - `accentColor`: `"#4F46E5"`
  - `docsPath`: `"docs"`
  - `logoPath`: `".vibtools/logo.png"` (`268,625` bytes, valid PNG under `2 MB`)
  - `branch`: `"main"`
  - `ctaLabel`: `"Get CalGrid"`, `ctaUrl`: `"https://vib.tools/calgrid"`
- `docs/` tree:
  - Root `docs/index.md` + `docs/MANIFEST.md` (auto-stripped during sync)
  - 5 sections (`getting-started/`, `guides/`, `workflows/`, `settings/`, `help/`) with subfolder `index.md` files and 27 total Markdown pages.
- Local files inspected:
  - `config/projects.json`
  - `config/presets/user-portal/projects.json`
  - `scripts/sync-docs.mjs`

---

## 2. Implementation Steps

1. Prioritize explicit `project.title` (from `config/projects.json` or `.vibtools/docs.config.json`) before `index.md` frontmatter `title` in `scripts/sync-docs.mjs` so Hub product cards and the Topbar product switcher display `"CalGrid"` rather than the full landing page heading `"CalGrid — User Documentation"`.
2. Add `"https://github.com/vibdocs/CalGrid.git"` to `config/projects.json` and `config/presets/user-portal/projects.json`.
3. Run `npm run sync`, `npm test`, `npm run lint`, and `npm run verify` to verify that all 32 CalGrid routes, subfolder `index.md` routes, `.md` exports, `/calgrid/llms.txt`, and `.vibtools/logo.png` build with zero broken links.

---

## 3. Execution & Verification Results

- Added parent `index.md` link-order tie-breaker in `src/utils/sidebar.ts` (`extractIndexLinkOrder`, `compareItems`) so subfolders whose `index.md` files share `order: 1` sort in the exact sequence linked from `docs/index.md` (`Getting Started` -> `Feature Guides` -> `Workflows` -> `Settings` -> `Help & Troubleshooting`).
- `npm test`: `17/17` pass.
- `npm run verify`: `Build verification passed: 39 HTML files, 16 required assets, 2 projects, and no broken internal links.` (`37` pages indexed by Pagefind, `2456` words).

