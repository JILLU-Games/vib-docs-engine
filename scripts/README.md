# Build and Release Scripts

This folder contains Node command-line tools. Run them from the repository root with the npm scripts in `package.json`; they use the active `config/site.config.json` and `config/projects.json` unless otherwise noted.

- `sync-docs.mjs` synchronizes product docs and emits the manifest.
- `add-project.mjs` interactively validates and appends a project record.
- `export-portal.mjs` creates a clean user/dev deployment repository from one preset.
- `verify-build.mjs` checks required static output, manifest routes, product AI indexes, and internal HTML links.
