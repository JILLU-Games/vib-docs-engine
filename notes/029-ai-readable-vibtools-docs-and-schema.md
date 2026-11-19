# 029 — AI-Readable `/vib-docs-engine/` Specification, Hosted `.vibtools` JSON Schema & LLMs Index Enhancement

**Date:** `2026-11-19`
**Goal:** Make `/vib-docs-engine/` and the portal's AI endpoints (`/llms.txt`, `/llms-full.txt`, `/vib-docs-engine/llms.txt`, `/vib-docs-engine/*.md`, and `/schemas/vibtools-docs.schema.json`) 100% self-explanatory and machine-readable for both AI coding agents and human developers setting up `.vibtools/` and `docs/` across `https://github.com/vibtoolshq` and `https://github.com/vibdocs`.

---

## 1. Inspected Files

- `docs/index.md` (`/vib-docs-engine/`)
- `docs/vibtools-config.md` (`/vib-docs-engine/vibtools-config/`)
- `docs/adding-projects.md` (`/vib-docs-engine/adding-projects/`)
- `src/utils/vibtoolsConfig.ts` & `src/utils/vibtoolsConfig.test.ts`
- `src/utils/llms.ts`
- `src/layouts/BaseLayout.astro`
- `public/_headers` & `nginx.conf`
- `scripts/verify-build.mjs`

---

## 2. Scope-Locked Implementation Steps

1. **Hosted Machine-Readable JSON Schema (`/schemas/vibtools-docs.schema.json`) & `$schema` Support:**
   - Add static endpoint `src/pages/schemas/vibtools-docs.schema.json.ts` serving the Draft 2020-12 JSON Schema for `.vibtools/docs.config.json` (and `.vibtools/config.docs.json`) with canonical `$id`.
   - Allow optional `"$schema"` string in `parseVibtoolsRepoConfig` (`src/utils/vibtoolsConfig.ts`) and add unit test coverage in `src/utils/vibtoolsConfig.test.ts`.
   - Add `/schemas/*.json` header rule (`Content-Type: application/schema+json; charset=utf-8`) in `public/_headers` and `nginx.conf`, and require `schemas/vibtools-docs.schema.json` in `scripts/verify-build.mjs`.
2. **Enhanced AI Discovery in `/llms.txt`, `/llms-full.txt`, `/<product>/llms.txt`, and `<head>`:**
   - Update `src/utils/llms.ts` (`buildRootLlmsText`, `buildProductLlmsText`, `buildRootLlmsFullText`) to expose `Portal Type`, `.vibtools Config JSON Schema` URL (`/schemas/vibtools-docs.schema.json`), direct `[Markdown]` links, and per-page sub-routes in `/llms.txt` so AI agents discover every `/vib-docs-engine/*.md` specification page immediately from `/llms.txt`.
   - Add `<link rel="alternate" type="text/plain" title="LLMs Full Documentation" href="/llms-full.txt" />` and `<link rel="describedby" type="application/schema+json" title="VibTools Docs Config JSON Schema" href="/schemas/vibtools-docs.schema.json" />` in `src/layouts/BaseLayout.astro`.
3. **Comprehensive AI-First & Developer-First `/vib-docs-engine/` Guides (`docs/index.md`, `docs/vibtools-config.md`, `docs/adding-projects.md`):**
   - Rewrite `docs/index.md` and `docs/vibtools-config.md` (and align `docs/adding-projects.md` & `.vibtools/docs.config.json`) with:
     - Machine-readable AI & JSON Schema endpoint directory.
     - 2-Organization & Dual-Portal architecture rules (`https://github.com/vibtoolshq` for open-source/developer/dual-target projects vs. `https://github.com/vibdocs` for public docs-only repositories of private projects).
     - Complete `.vibtools/docs.config.json` field contract, validation patterns, single vs. dual-portal `targets.users` / `targets.developer` rules, and metadata precedence.
     - Complete `docs/` folder authoring specification (`index.md`/`README.md` root rule, frontmatter, Smart Markdown extraction fallback, numeric prefix ordering, subfolder `index.md` group headers, `MANIFEST.md` auto-strip rule, relative `.md` link rewriting, and `Callout`/`CodeTabs` MDX components).
     - Step-by-step AI Agent onboarding workflow & 10-point self-verification checklist.
4. **Verification Plan & Execution Results:**
   - `npm test`: `17/17` unit tests pass (including `$schema` validation and `buildVibtoolsJsonSchema`).
   - `npm run lint` (`tsc --noEmit`) & `npx tsc -p functions/tsconfig.json --noEmit`: `0` errors.
   - `npm run verify`: `Build verification passed: 7 HTML files, 16 required assets, 1 projects, and no broken internal links.`
   - Verified built `dist/schemas/vibtools-docs.schema.json`, `dist/llms.txt`, `dist/llms-full.txt`, `dist/vib-docs-engine/llms.txt`, and `dist/vib-docs-engine/vibtools-config.md`.

