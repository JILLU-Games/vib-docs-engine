# Plan: Sync Metadata Precedence & Sparse-Branch `.vibtools/` Re-Read (`2026-11-20`)

## Goal

Ensure upstream repository `.vibtools/docs.config.json` (and `.vibtools/config.docs.json`) updates to `description`, `version`, and custom `branch` targets sync accurately during every `npm run sync` / `prebuild` / `predev` / Cloudflare Pages redeploy without altering the frozen `.vibtools/` JSON Schema contract, UI components, or build command (`npm run build`).

## Inspected Files

- `scripts/sync-docs.mjs` (`syncProject`, lines `516-758`)
- `src/utils/vibtoolsConfig.ts` (`resolvePortalProjectConfig`, `extractMarkdownMetadata`)
- `src/utils/vibtoolsConfig.test.ts`
- `scripts/verify-build.mjs`
- `project/05-frozen-vibtools-schema.md`
- `project/04-codebase-reference.md`

## Implementation Steps

1. **Extract pure sync metadata & branch-switch helpers (`src/utils/syncMetadata.ts` + `src/utils/syncMetadata.test.ts`):**
   - Implement `resolveProjectDisplayMetadata()` so resolved `.vibtools/` / registry metadata (`title`, `description`, `version`) takes precedence over root `index.md` YAML frontmatter, followed by `extractMarkdownMetadata()` and slug/heading fallbacks.
   - Implement cycle-safe `nextSparseBranchTarget()` to guard sparse branch switching (`visitedBranches` set) before re-reading `.vibtools/` from the target branch.
   - Add deterministic `node:test` coverage in `src/utils/syncMetadata.test.ts`.
2. **Wire helpers into `scripts/sync-docs.mjs` (scope-locked):**
   - Load `src/utils/syncMetadata.ts` via `loadTypeScriptModule()`.
   - When `switchGitSparseBranch()` switches to a non-default branch, re-read `.vibtools/` from `repoRootForMetadata` and re-run `resolvePortalProjectConfig()` (handling `matched === false` skips and post-resolution `reservedSlugs` checks cleanly).
   - Replace inline `title` / `description` / `version` fallback logic (`lines 688-703`) with `resolveProjectDisplayMetadata()`.
3. **Verify & Document:**
   - Run `npm test`, `STRICT_SYNC=1 npm run verify`, `tsc --noEmit`, `restart_dev_server`, and live Playwright browser check (`/` and `/calgrid/`).
   - Update `notes/006`, `src/utils/MANIFEST.md`, `project/04-codebase-reference.md`, `project/05-frozen-vibtools-schema.md` (precedence note line 52 only; schema untouched), and `project/CHANGELOG.md`.

## Progress & Results

- Created `src/utils/syncMetadata.ts` (`resolveProjectDisplayMetadata`, `nextSparseBranchTarget`) and `src/utils/syncMetadata.test.ts` (3 unit tests covering `.vibtools/` display precedence and cycle-safe sparse-branch switching).
- Updated `scripts/sync-docs.mjs` (`syncProject`) to re-read `.vibtools/` and re-run `resolvePortalProjectConfig()` after `switchGitSparseBranch()`, reserve slugs after final branch resolution, and resolve display `title`, `description`, and `version` via `resolveProjectDisplayMetadata()`.
- Updated `src/utils/MANIFEST.md`, `project/04-codebase-reference.md`, `project/05-frozen-vibtools-schema.md` (precedence order documentation per owner instruction; JSON schema unchanged), and `project/CHANGELOG.md`.
- Verified `npm test` (`26/26` pass), `lint_applet` (`tsc --noEmit`), `compile_applet`, `STRICT_SYNC=1 npm run verify` (`48` HTML files, `16` required assets, `2` projects, `CalGrid` `version: "1.0.4"`, `ReadBox` `.vibtools/` `targets.users.description`, `0` broken links), and live dev-server preview via `playwright-cli`.
