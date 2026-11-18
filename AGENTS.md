# Repository Agent Instructions

## Documentation-first change process

Before every code, configuration, or documentation change:

1. Read the relevant source files and existing project/docs guidance.
2. Add a dated plan to `notes/` describing the goal, inspected files, small implementation steps, and a concrete verification check. Do this before editing the implementation.
3. During the work, update that note with completed steps, decisions, test results, and any remaining caveat.

After every implemented change, update the durable documentation in `project/` with the affected feature, modules/files, behavior, setup/configuration, and the location of the relevant logic. Update `docs/` with user/operator instructions when observable behavior or operation changes. Append a dated entry to `project/CHANGELOG.md`. Do not claim details that were not confirmed from source or tests; label unknown/not-yet-implemented behavior explicitly.

## Directory ownership

- `notes/`: development-only plans, investigations, and working logs. Never import these files into the app or publish them. The portal exporter must exclude this folder.
- `project/`: tracked source-of-truth specs, code maps, function/module responsibilities, setup decisions, and implementation history. Keep its README and MANIFEST current.
- `docs/`: tracked operator and portal-user guides. Document only behavior confirmed in the implementation. Keep its README and MANIFEST current.
- Tracked, non-routable authored source/config directories should each contain a short `README.md` explaining purpose/ownership and a `MANIFEST.md` inventorying direct children and their roles. `src/pages/` and `src/pages/[product]/` are intentional exceptions: Astro treats Markdown files there as routes. Document those route trees from `src/MANIFEST.md` and `project/04-codebase-reference.md`, not with local Markdown files.
- Do not add governance Markdown to generated or vendor directories: `node_modules/`, `dist/`, `.astro/`, `.playwright-mcp/`, `artifacts/`, `src/content/docs/`, `src/generated/`, or `public/logos/`. These are generated, ignored, or deployment assets; document them from the nearest tracked parent instead.

## Technical accuracy and safety

- Treat the checked-in source and validated build as authoritative. Never guess what a function, page, or button does.
- Preserve user edits and generated data ownership. Do not hand-edit auto-synced `src/content/docs/`, generated `src/generated/manifest.json`, or build output.
- Keep portal configs separate; do not hardcode user/developer products or categories in application code.
- Never put credentials in presets, source URLs, logs, notes intended for export, or generated manifests. Use deployment secrets.
- Keep changes narrow and run the relevant syntax, TypeScript, build, and/or verifier checks after edits.
