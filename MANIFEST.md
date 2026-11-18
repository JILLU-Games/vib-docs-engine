# Repository Root Manifest

| Path                                        | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `AGENTS.md`                                 | Required change-planning and documentation rules                        |
| `README.md`                                 | Project overview, operating commands, and links to source-of-truth docs |
| `MANIFEST.md`                               | Inventory of root files/folders                                         |
| `CONTRIBUTING.md`                           | Contributor setup and verification guide                                |
| `SECURITY.md`                               | Private vulnerability reporting instructions                            |
| `package.json`, `package-lock.json`         | npm scripts and locked dependencies                                     |
| `astro.config.mjs`, `tsconfig.json`         | Astro integrations/static output and TypeScript setup                   |
| `Dockerfile`, `nginx.conf`, `.dockerignore` | VPS/Coolify static deployment assets                                    |
| `.gitignore`                                | Generated/dependency exclusions                                         |
| `.github/`                                  | Issue forms, pull-request template, and GitHub submission guidance      |
| `config/`                                   | Active portal config and dual-portal presets                            |
| `docs/`                                     | Operator and portal-user documentation                                  |
| `notes/`                                    | Development-only plans and working logs; not exported                   |
| `project/`                                  | Architecture, feature, UI, source map, and changelog                    |
| `public/`                                   | Static browser assets                                                   |
| `scripts/`                                  | Sync, project, export, and build-verification CLIs                      |
| `src/`                                      | Astro application source, routes, components, styles, types             |
| `templates/`                                | Cross-repository deployment webhook templates                           |

Generated/dependency paths such as `dist/`, `.astro/`, `node_modules/`, `.playwright-mcp/`, and `artifacts/` are not maintained source folders and do not receive documentation files.
