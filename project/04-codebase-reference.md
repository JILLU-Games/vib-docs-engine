# Current Codebase Reference

This reference maps checked-in source to responsibilities. Build outputs, synchronized docs, and dependency internals are intentionally excluded. Update this document whenever modules or behavior change.

## Root configuration and commands

`package.json`: npm lifecycle commands. `predev` and `prebuild` run `scripts/sync-docs.mjs`; `build` runs Astro then Pagefind; `verify` builds and runs `scripts/verify-build.mjs`; `add-project` and `export-portal` invoke their built-in Node CLI scripts.

## Key Function Map

| File                                  | Function                                                   | Responsibility                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `scripts/sync-docs.mjs`               | `parseJsonFile` / `requireText`                            | Read site/project JSON config.                                                                                     |
| `scripts/sync-docs.mjs`               | `sanitizeError`                                            | Redact secrets and credential-bearing HTTPS URLs in errors.                                                        |
| `scripts/sync-docs.mjs`               | `clearOutputDirectory`                                     | Clear generated output while preserving `.gitkeep`.                                                                |
| `scripts/sync-docs.mjs`               | `assertWithin`                                             | Prevent local docs paths escaping the engine directory.                                                            |
| `scripts/sync-docs.mjs`               | `copyTree`                                                 | Recursively copy docs and relative assets; reject symlinks.                                                        |
| `scripts/sync-docs.mjs`               | `authenticatedCloneUrl` / `cloneAndCheckout`               | Add environment-based HTTPS auth and perform non-interactive shallow sparse checkout.                              |
| `scripts/sync-docs.mjs`               | `formatSlug` / `metadataString` / `titleFromMarkdown`      | Apply title, description, and version fallback rules.                                                              |
| `scripts/sync-docs.mjs`               | `findLogo`                                                 | Find, validate, and copy supported logos/icons.                                                                    |
| `scripts/sync-docs.mjs`               | `loadSidebarBuilder`                                       | Transpile the typed shared sidebar module for Node execution.                                                      |
| `scripts/sync-docs.mjs`               | `syncProject`                                              | Copy one project's source, normalize index, extract metadata/logo, create enriched record.                         |
| `scripts/sync-docs.mjs`               | `main`                                                     | Validate config, isolate per-project failures, derive categories, and write the manifest including empty catalogs. |
| `src/utils/sidebar.ts`                | `buildSidebar`                                             | Public entry point returning nested `sidebar` and ordered `flatPages`.                                             |
| `src/utils/sidebar.ts`                | `cleanSegment` / `humanize`                                | Remove numeric route prefixes and create display labels.                                                           |
| `src/utils/sidebar.ts`                | `inspectPage` / `compareItems`                             | Read frontmatter/order and apply deterministic page/group order.                                                   |
| `src/utils/sidebar.ts`                | `walk` / `flatten`                                         | Recursively create sidebar groups and depth-first pagination.                                                      |
| `src/utils/theme.ts`                  | `resolveAccentColor`                                       | Validate project/site accent and return the safe default if invalid.                                               |
| `src/utils/theme.ts`                  | `getMonogram`                                              | Derive one/two uppercase initials when a logo is absent.                                                           |
| `scripts/add-project.mjs`             | `isGitRemote` / `validateRemote`                           | Distinguish Git remotes and reject malformed or credential-bearing HTTPS URLs.                                     |
| `scripts/add-project.mjs`             | `askUntil` / `createPromptReader`                          | Prompt with validation in terminals or buffered non-TTY input.                                                     |
| `scripts/add-project.mjs`             | `resolveLocalPath`                                         | Restrict test docs paths to existing directories inside the engine.                                                |
| `scripts/add-project.mjs`             | `main`                                                     | Load registry, reject duplicate slug, collect config, and atomically replace JSON.                                 |
| `scripts/export-portal.mjs`           | `parseArgs`                                                | Validate portal selector and output directory options.                                                             |
| `scripts/export-portal.mjs`           | `isWithin` / `shouldSkip`                                  | Prevent recursive exports and omit generated/vendor/preset/notes paths.                                            |
| `scripts/export-portal.mjs`           | `copyEngine`                                               | Recursively copy clean source and preserve `.gitkeep` in generated roots.                                          |
| `scripts/export-portal.mjs`           | `main`                                                     | Validate preset, export to staging, inject paired configs, atomically rename.                                      |
| `scripts/verify-build.mjs`            | `exists` / `walkHtml`                                      | Check required output files and enumerate built HTML.                                                              |
| `scripts/verify-build.mjs`            | `routeToHtml`                                              | Map each manifest route to its static index file.                                                                  |
| `scripts/verify-build.mjs`            | `resolveInternalHref`                                      | Resolve root-relative URLs safely within `dist/`.                                                                  |
| `scripts/verify-build.mjs`            | `main`                                                     | Verify assets/routes/per-product AI indexes and report broken internal links.                                      |
| `src/components/ui/SearchModal.astro` | `getPagefind` / `search`                                   | Lazy-load Pagefind once and issue global or product-filtered queries.                                              |
| `src/components/ui/SearchModal.astro` | `safeResultUrl` / `appendSafeExcerpt` / `createResultItem` | Keep results same-origin and render excerpts as text plus safe `mark` nodes.                                       |
| `src/components/ui/SearchModal.astro` | `setScope` / `scheduleSearch` / `openModal` / `closeModal` | Manage scope, debounce, focus/scroll lock, and modal lifecycle.                                                    |

## Dependency Rationale

- Astro, Content Collections, and `@astrojs/mdx` compile Markdown/MDX to static routes and render content at build time.
- Tailwind CSS v4 and `@tailwindcss/typography` supply the compact tokenized design system and prose styling.
- Expressive Code renders syntax-highlighted code at build time; it does not require a runtime code service.
- `@astrojs/sitemap` generates the static sitemap from the configured canonical domain.
- Pagefind creates the local post-build search index; the browser loads it only after opening search.
- `gray-matter` parses source frontmatter; Zod validates site/project configuration and schemas.
- TypeScript supplies shared contracts and transpiles the typed sidebar helper for the sync script.
- `lucide-astro` compiles icons into the page; no runtime icon API is used.
- `@astrojs/markdown-remark` supplies Astro's Unified processor so external Markdown links receive safe new-tab attributes while relative/internal links remain unchanged.

## Directory Documentation Policy

Tracked, non-routable authored folders carry a local `README.md` and `MANIFEST.md` for purpose and direct-child inventory. Astro route folders `src/pages/` and `src/pages/[product]/` intentionally do not: Markdown files there become routes. Their inventory lives in `src/MANIFEST.md` and this reference. Generated/vendor directories (`node_modules/`, `.astro/`, `dist/`, `src/content/docs/`, `src/generated/`, `public/logos/`, and Playwright artifacts) are also documented from their parent because sync/build owns or removes their contents.

- `package-lock.json`: reproducible dependency versions for npm install/CI.
- `astro.config.mjs`: dynamic site domain, static output, Astro integrations (MDX, sitemap, Expressive Code, Tailwind Vite), and a Unified remark processor that marks only HTTP(S) Markdown links for `_blank` plus `noopener noreferrer`.
- `tsconfig.json`: Astro strict TypeScript configuration and generated virtual module inclusion.
- `Dockerfile` / `nginx.conf`: multi-stage static image and file serving/caching; `.dockerignore` excludes local secrets and build/dependency output.
- `AGENTS.md`: repository documentation/change process.

## Configuration

- `config/site.config.json`: active portal title, subtitle, canonical domain, brand and navigation.
- `config/projects.json`: active project records. `branch`/`docsPath` default in the sync validator; categories derive from the records. `localPath` is test-only and must not be used in deployed config.
- `config/presets/user-portal/`: user documentation site config and example product registry.
- `config/presets/dev-portal/`: developer documentation site config and example registry.

## Build and content source

- `scripts/sync-docs.mjs`: validates config; clears only generated output while preserving `.gitkeep`; uses Git sparse checkout or temporary local path; recursively copies ordinary files/assets; normalizes `README.md` to an index; parses frontmatter with gray-matter; resolves title/description/version; validates and copies recognized logos; calls the sidebar builder; writes `src/generated/manifest.json`. Important functions include `projectSchema`, `siteConfigSchema`, `clearOutputDirectory`, `copyTree`, `cloneAndCheckout`, `findLogo`, `loadSidebarBuilder`, `syncProject`, and `main`.
- `src/utils/sidebar.ts`: `buildSidebar` recursively reads `.md`/`.mdx`, derives normalized routes/titles, sorts by order/numeric prefix/name, detects route collisions, and produces sidebar plus flat pagination pages.
- `src/utils/manifest.ts`: TypeScript contracts for portal config, products, sidebar nodes, and page-order entries.
- `src/content.config.ts`: Astro `docs` collection using the glob loader and permissive optional frontmatter schema.
- `src/content/docs/`: generated content copied from project repositories. Never author or hand-edit here.
- `src/generated/manifest.json`: generated cross-phase data contract. Never hand-edit; `npm run sync` owns it.
- `src/styles/global.css`: Tailwind v4 entry, light/dark tokens, base styles, and `.docs-prose` rules.

## UI modules and routes

- `src/layouts/BaseLayout.astro`: CSS entry, theme-before-paint script, SEO/canonical/OpenGraph, favicon, global search modal mount.
- `src/layouts/HubLayout.astro`: portal header, global search event, nav, footer, theme control.
- `src/layouts/DocsLayout.astro`: article metadata, Pagefind body/filter/meta, breadcrumb, sidebar, topbar, TOC, Prev/Next placement.
- `src/components/hub/CategoryTabs.astro`: dynamic category filtering; omitted for zero/one category.
- `src/components/hub/ProjectCard.astro`: manifest-backed link, logo/monogram, category, description, version.
- `src/components/docs/Topbar.astro`: product switcher, scoped search event, CTA, theme and mobile-sidebar control.
- `src/components/docs/Sidebar.astro` and `SidebarTree.astro`: recursive navigation and mobile drawer.
- `src/components/docs/TableOfContents.astro`: heading links and scroll spy.
- `src/components/docs/PrevNextNav.astro`: validated source edit URL and adjacent flat-page links.
- `src/components/mdx/Callout.astro` and `CodeTabs.astro`: MDX callouts and client-side tab groups.
- `src/components/ui/ThemeToggle.astro` / `SearchModal.astro`: persistent theme switch and lazy Pagefind global/scoped search.
- `src/utils/theme.ts`: accent validation fallback and monogram generation.
- `src/pages/index.astro`: static Hub route.
- `src/pages/[product]/[...slug].astro`: manifest/collection route parity; resolves collection file paths to `flatPages` and renders MD/MDX content with helper components.
- `src/pages/[product]/llms.txt.ts`, `src/pages/llms.txt.ts`, `src/pages/robots.txt.ts`, `src/pages/404.astro`: static AI indexes, crawler instructions, and fallback page.

## Automation

- `scripts/add-project.mjs`: interactive validated registry writer. Reads categories, rejects duplicate slugs, accepts Git remotes or in-repository local test paths, defaults branch/accent, permits optional CTA, and atomically renames a temporary JSON file.
- `scripts/export-portal.mjs`: copies the clean source tree to a new external directory, excludes generated/vendor/preset/notes paths, preserves `.gitkeep`, injects one selected preset, and refuses an existing output path.
- `scripts/verify-build.mjs`: validates required build artifacts, each manifest route and product `llms.txt`, then checks internal absolute-path `href` attributes in built HTML resolve inside `dist/`.
- `templates/github-notify-docs.yml`: GitHub Actions push-to-main/docs-path build-hook caller.
- `templates/webhook-trigger.sh`: protected environment-variable curl hook for other Git hosts/VPS pipelines.

## Local setup and verification

Use `npm ci` in clean CI or `npm install` locally. Set Git credentials through environment/deployment secrets only. Run `npm run sync`, `npm run dev`, `npm run build`, `npm run verify`, or `npm run preview` for their corresponding tasks. The exact production checks and portal deployment steps live in `docs/deployment.md`.
