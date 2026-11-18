# Repository Root Manifest

| Path                                        | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `AGENTS.md`                                 | Required change-planning and documentation rules                        |
| `README.md`                                 | Project overview, operating commands, and links to source-of-truth docs |
| `MANIFEST.md`                               | Inventory of root files/folders                                         |
| `CONTRIBUTING.md`                           | Contributor setup and verification guide                                |
| `SECURITY.md`                               | Private vulnerability reporting instructions                            |
| `package.json`, `package-lock.json`, `bun.lock` | npm/Bun scripts (`build`, `cf:build`, `pages:build`), Node 22 engine lock, and dependencies |
| `astro.config.mjs`, `tsconfig.json`         | Astro integrations/static output and TypeScript setup                   |
| `wrangler.toml`, `.node-version`, `.nvmrc`  | Cloudflare Pages & Functions configuration and Node.js `22.24.0` pin    |
| `functions/`                                | Cloudflare Pages Functions (`/api/health`, `/api/webhook`) & isolated `tsconfig.json` |
| `Dockerfile`, `nginx.conf`, `.dockerignore` | VPS/Coolify static deployment assets                                    |
| `.gitignore`                                | Generated/dependency exclusions                                         |
| `.github/`                                  | Issue forms, pull-request template, and GitHub submission guidance      |
| `.vibtools/`                                | Self-hosted `vib-docs-engine` `.vibtools/docs.config.json` & `logo.png` configuration |
| `config/`                                   | Active portal config and dual-portal presets                            |
| `docs/`                                     | Operator and portal-user documentation                                  |
| `notes/`                                    | Development-only plans and working logs; not exported                   |
| `project/`                                  | Architecture, feature, UI, source map, and changelog                    |
| `public/`                                   | Static browser and Cloudflare Pages edge assets (`_headers`, `_redirects`, `_routes.json`) |
| `scripts/`                                  | Sync, project, export, and build-verification CLIs                      |
| `src/`                                      | Astro application source, routes, components, styles, types             |
| `templates/`                                | Cross-repository deployment webhook templates                           |

Generated/dependency paths such as `dist/`, `.astro/`, `.wrangler/`, `node_modules/`, `.playwright-mcp/`, and `artifacts/` are not maintained source folders and do not receive documentation files. Route-mapped directories (`src/pages/`, `functions/`) are documented here and in `project/04-codebase-reference.md` so route scanners only see valid handlers.
