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

## 2026-11-18 — Dev server startup & local self-docs sync fallback

- Configured `package.json` (`dev`, `build`, and `preview` scripts) with `NODE_OPTIONS="--import data:text/javascript,process.versions.webcontainer='1'"` (enabling Astro 7 CLI's `>=22.22.0` container floor on Node `v22.23.2`) and `astro.config.mjs` (`server.host: "0.0.0.0"`, `server.port: 3000`, `vite.server.allowedHosts: true`) so the Astro dev server listens on port 3000 for container proxy environments.
- Updated `scripts/sync-docs.mjs` (`syncProject`) to fall back to the verified in-repository `docsPath` directory when remote cloning fails for `vib-docs-engine` without credentials, allowing `predev` and `prebuild` to generate `src/generated/manifest.json` without modifying `config/projects.json`.
- Moved `<nav aria-label="Breadcrumb">` inside the `max-w-[740px]` center reading column in `src/layouts/DocsLayout.astro` so the `xl:grid-cols-[minmax(0,1fr)_13rem]` layout keeps the article in the main column and `TableOfContents` in the right rail.
- Verified `npm run verify`: 8 HTML files, 6 required assets, 1 project, and zero broken internal links.

## 2026-11-18 — Phase 01: Sync Engine, Content Filtering & Brand Assets (`BUG-01`, `BUG-05`, `BUG-06`, `BUG-10`, `BUG-11`, `EH-01`–`EH-03`)

- Added `public/logos/vib-tools.svg` matching `config/site.config.json` (`brand.logo`) and updated `scripts/sync-docs.mjs` (`clearOutputDirectory` and `main`) to preserve `.gitkeep`, `vib-tools.svg`, and configured brand logos in `public/logos/` during sync (`BUG-10`).
- Added explicit YAML frontmatter (`title: Vib Docs Engine`, `description`, `version: "0.1.0"`) to `docs/index.md` (`BUG-11`) and prioritized `project.title` before `titleFromMarkdown` H1 fallback in `scripts/sync-docs.mjs`.
- Implemented `normalizeDocsTree` and `resolveRootIndexPath` in `scripts/sync-docs.mjs` and matching filters in `src/utils/sidebar.ts`, `src/pages/[product]/[...slug].astro`, and `src/pages/[product]/llms.txt.ts` to recursively remove `MANIFEST.md` and `draft: true` files, deduplicate or promote `README.md` across all subdirectories, validate `draft` boolean frontmatter (`EH-01`, `EH-02`), and keep `"Overview"` as the root index sidebar label (`BUG-01`, `BUG-05`, `BUG-11`).
- Updated `ManifestProject.repoUrl` in `src/utils/manifest.ts` to optional (`repoUrl?: string`) and added an early undefined guard in `src/components/docs/PrevNextNav.astro` (`getEditUrl`) (`BUG-06`, `EH-03`).
- Verified `npm run sync`, `npx tsc --noEmit`, and `npm run verify`: 6 static HTML pages built (`MANIFEST` and `README` route pollution eliminated), 4 docs pages indexed by Pagefind, `"title": "Vib Docs Engine"` and `"version": "0.1.0"` in `src/generated/manifest.json`, and 0 broken internal links.

## 2026-11-18 — Phase 02: Markdown Link Rewriting, Remark Pipeline & Build Verifier (`BUG-02`, `BUG-03`, `BUG-04`, `EH-04`)

- Added `rewriteInternalMarkdownLinks` and `cleanSegment` in `astro.config.mjs` to rewrite relative `.md`/`.mdx` links (such as `[Adding Projects](adding-projects.md)`) into normalized Astro product routes (`/vib-docs-engine/adding-projects/`) with query/hash preservation (`BUG-02`).
- Shared `sharedRemarkPlugins = [externalMarkdownLinks, rewriteInternalMarkdownLinks]` across both `mdx({ remarkPlugins: sharedRemarkPlugins })` and `markdown: { processor: unified({ remarkPlugins: sharedRemarkPlugins }) }` in `astro.config.mjs` so `.md` and `.mdx` documents share identical remark behavior without Astro 7 deprecation warnings (`BUG-03`).
- Upgraded `scripts/verify-build.mjs` (`isInternalReference`, `resolveCandidatePath`, `resolveInternalHref`, `resolveInternalAsset`) to validate both root-relative and document-relative `href` attributes as well as internal `img[src]` assets across all generated HTML files in `dist/` (`BUG-02`, `BUG-04`, `EH-04`).
- Verified `npm run verify` and `npx tsc --noEmit`: `<a href="/vib-docs-engine/adding-projects/">Adding Projects</a>` rendered in `dist/vib-docs-engine/index.html`, 6 HTML files verified, and 0 broken internal links or missing image assets.

## 2026-11-18 — Phase 03: UI/UX Interactive Components & Dev Search Support (`BUG-12`, `BUG-13`, `BUG-14`, `BUG-15`, `BUG-16`)

- Updated `src/utils/sidebar.ts` (`walk`) to resolve subfolder `SidebarGroup.title` from `index.md` frontmatter `title` when present and not `"Overview"`, and updated `src/components/docs/SidebarTree.astro` to highlight active group headers and normalize trailing slashes via `normalizePath` for active page links (`BUG-12`, `BUG-13`).
- Added `ArrowDown`, `ArrowUp`, and `Enter` keyboard navigation across `#search-results a[href]` elements in `src/components/ui/SearchModal.astro` (`BUG-14`).
- Added `servePagefindInDev` Vite middleware in `astro.config.mjs` to serve `/pagefind/*` assets from `dist/pagefind/` during `astro dev` (`BUG-15`).
- Updated `src/components/mdx/CodeTabs.astro` to automatically bind direct child elements inside `[data-code-panels]` to `labels[index]` when explicit `[data-code-panel]` wrappers are omitted (`BUG-16`).
- Verified `npm run verify`, `npx tsc --noEmit`, and live dev-mode Pagefind search and keyboard navigation on `http://localhost:3000`.

## 2026-11-18 — Phase 04: CLI, Portal Exporter, Presets, AI Endpoints & Docker Hardening (`BUG-07`, `BUG-08`, `BUG-09`, `BUG-17`, `BUG-18`, `EH-05`, `EH-06`)

- Updated `scripts/add-project.mjs` (`validateDocsPath`, `main`) to prompt for custom `docsPath` (default `"docs"`) with path traversal validation and enforce paired `ctaLabel`/`ctaUrl` persistence (`BUG-07`, `EH-05`).
- Updated `scripts/export-portal.mjs` and `.gitignore` to exclude `.playwright-mcp`, `.playwright-cli`, and `artifacts`, and preserved `public/logos/vib-tools.svg` in exported portals (`BUG-08`).
- Updated `scripts/sync-docs.mjs` (`syncProject`) to fall back to the local `./docs` fixture with an explicit operator warning when a preset entry still uses a `YOUR_ORG` placeholder URL (`BUG-09`, `EH-06`).
- Updated `src/pages/[product]/llms.txt.ts` to strip YAML frontmatter via `gray-matter` before emitting markdown bodies (`BUG-17`).
- Removed `ARG GIT_TOKEN` from `Dockerfile` so Git credentials are only accepted via BuildKit secret mounts (`BUG-18`).
- Verified `npm run verify`, `npx tsc --noEmit`, clean YAML-free output in `dist/vib-docs-engine/llms.txt`, and `export-portal` smoke export.

## 2026-11-18 — Phase 05: Per-Project Secret Key Config & Public/Private Git Sync

- Added optional `secretKey`, `gitToken`, `gitTokenEnv`, and `gitUsername` fields to `projectSchema` in `scripts/sync-docs.mjs` and interactive prompts in `scripts/add-project.mjs`.
- Implemented `resolveSecretValue`, `resolveProjectAuth`, and `runGitSparseClone` in `scripts/sync-docs.mjs`: private repos use their configured `secretKey` (supporting direct tokens or `$ENV_VAR` / `ENV_VAR` names) and auto-detect `oauth2` (GitLab) vs `x-access-token` (GitHub/Gitea/Forgejo), while public repos clone directly without any secret key.
- Stripped `secretKey`, `gitToken`, `gitTokenEnv`, and `gitUsername` before writing `src/generated/manifest.json` and redacted project secrets in `sanitizeError`.
- Updated `docs/adding-projects.md`, `notes/003-phase-execution-tracker.md`, and `project/04-codebase-reference.md`; verified `npm run verify` and `npx tsc --noEmit`.

## 2026-11-18 — Phase 06: Cloudflare Pages & Functions Build-Ready Setup

- Added `wrangler.toml`, `.node-version`, and `.nvmrc` pinning Node.js `22` and configuring `pages_build_output_dir = "dist"` for Cloudflare Pages & Functions.
- Added `public/_headers` (edge cache and security headers), `public/_redirects` (legacy domain redirect), and `public/_routes.json` (routing `/api/*` to Cloudflare Pages Functions while serving all static pages from the CDN edge).
- Added Cloudflare Pages Functions (`functions/api/health.ts` and `functions/api/webhook.ts`) for runtime health checks (`GET /api/health`) and secret-authenticated webhook rebuild relays (`POST /api/webhook`).
- Updated `package.json` (`engines.node: ">=22.0.0"`, `cf:build`, `pages:build`, direct `pagefind --site dist` binary call, and `pagefind` moved to `dependencies` for production CI installs).
- Updated `scripts/verify-build.mjs`, `scripts/export-portal.mjs`, `.gitignore`, `MANIFEST.md`, `public/MANIFEST.md`, `docs/deployment.md`, and `project/04-codebase-reference.md`; verified `npm run verify` and `npx tsc --noEmit`.

## 2026-11-18 — CF-Phase 01: Cloudflare Build Determinism, Lockfile & Edge Headers/Redirects

- Generated `package-lock.json` via `npm install --package-lock-only` so `npm ci`, `Dockerfile`, and Cloudflare Pages npm installs run deterministically alongside `bun.lock`.
- Updated `package.json` (`dev`, `build`, `preview`) to preserve pre-existing CI `NODE_OPTIONS` flags (`${NODE_OPTIONS:+$NODE_OPTIONS }...`) and pinned `.node-version` and `.nvmrc` to `22.24.0` to satisfy Astro `7.4.12` (`>=22.23.4`).
- Updated `public/_headers` with explicit `Content-Type: text/plain; charset=utf-8` and `Cache-Control` rules for `/llms.txt`, `/*/llms.txt`, and `/robots.txt`.
- Fixed `public/_redirects` by removing the invalid custom-domain rule (`https://docs.vibtools.io/*`) that Cloudflare Pages `_redirects` does not support and that leaked into `dev-portal` exports.
- Verified `NODE_OPTIONS="--max-old-space-size=2048" npm run build`, `node scripts/verify-build.mjs` (`6` HTML pages, `9` required assets, `0` broken links), and `npx tsc --noEmit`.

## 2026-11-18 — CF-Phase 02: Cloudflare Pages Functions & Multi-Provider Webhook Hardening

- Added `functions/tsconfig.json` (`ES2022`, `WebWorker` lib, strict isolated checking) for Cloudflare Pages Functions handlers.
- Added `onRequest` `405 Method Not Allowed` fallback handler to `functions/api/health.ts`.
- Upgraded `functions/api/webhook.ts` with Web Crypto `HMAC-SHA256` signature verification for GitHub (`X-Hub-Signature-256`) and Gitea/Forgejo (`X-Gitea-Signature`, `X-Forgejo-Signature`) alongside existing `X-Webhook-Secret`, `X-Gitlab-Token`, and `Authorization: Bearer` checks, plus optional `ALLOWED_BRANCHES` ref filtering (`200` skipped on non-matching branches).
- Documented `ALLOWED_BRANCHES` in `wrangler.toml`; verified `npx tsc -p functions/tsconfig.json --noEmit` and automated 7/7 runtime assertions.

## 2026-11-18 — CF-Phase 03: Build Verifier Upgrade & Documentation Sync

- Updated `scripts/verify-build.mjs` to require `functions/tsconfig.json`, validate `dist/_routes.json` JSON schema (`version: 1`, `include`/`exclude` arrays), and flag unsupported non-`pages.dev` custom-domain source URLs in `dist/_redirects`.
- Synchronized `docs/deployment.md`, `MANIFEST.md`, `project/04-codebase-reference.md`, and `notes/003-cloudflare-phase-tracker-and-future-plan.md` with the verified Cloudflare Pages & Functions setup (`22.24.0` Node pin, `package-lock.json`, multi-repo `GIT_TOKEN`/`secretKey`, HMAC webhooks, and Zone Redirect Rules).
- Verified `npm run verify`, `npx tsc --noEmit`, `npx tsc -p functions/tsconfig.json --noEmit`, and `export-portal` smoke exports (`100%` Cloudflare Pages & Functions Ready).

## 2026-11-18 — Vib Tools Branding Audit & Original Asset Integration

- Audited all 17 uploaded files in `public/vib.tools.Branding/vib.tools.Branding/` (`5.2 MB`): identified exact SHA-256 duplicate (`icon-512.png` === `vibtools-icon.png`), base64-PNG-wrapped `favicon.svg` (`214 KB`), oversized avatar/icon variants (`1.4 MB` each), and broken `site.webmanifest` template (`MyWebSite`, invalid `/favicon/...` icon URLs).
- Replaced placeholder SVGs (`public/favicon.svg`, `public/logos/vib-tools.svg`) and removed the unorganized raw branding directory with clean production assets: `public/logos/vib-tools.png` (`19 KB`, `128x128` crisp mark), `public/favicon.ico`, `public/favicon-96x96.png`, `public/apple-touch-icon.png`, `public/web-app-manifest-192x192.png`, `public/web-app-manifest-512x512.png`, `public/og-default.png`, and corrected `public/site.webmanifest`.
- Updated `config/site.config.json`, `config/presets/*/site.config.json`, `.gitignore`, `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `src/layouts/BaseLayout.astro`, `src/layouts/HubLayout.astro`, `scripts/verify-build.mjs`, and `public/` manifests to wire `/logos/vib-tools.png`, favicons, PWA manifest, and OpenGraph social cards (`og:image`, `twitter:image`).

## 2026-11-18 — Search UI & SearchModal Scope-Locked Fix

- Fixed `src/components/ui/SearchModal.astro` positioning (`flex items-start justify-center pt-10 sm:pt-14` + `mx-auto`) eliminating the top-left pinning bug, added explicit `[hidden]` display overrides and `flex` on `[data-search-scope-bar]`, hid browser-native `-webkit-search-cancel-button` to prevent duplicate `×` buttons, and switched highlight styling to `:global(.search-palette mark)` with `--accent-color` tinting.
- Added smooth backdrop/palette transitions with scrollbar gutter compensation, clickable `ESC` close button, compact result rows with file/clock icons and sub-result rails, keyboard hint footer (`↑↓`, `↵`, `ESC`), and Stripe-style empty-state `Recently viewed` (`localStorage`) + manifest-backed `Suggested` links powered by pure helpers in `src/utils/search.ts`.
- Polished `[data-search-trigger]` (`src/layouts/HubLayout.astro`) and `[data-doc-search-trigger]` (`src/components/docs/Topbar.astro`) with `cursor-pointer` and balanced desktop trigger spacing.
- Verified `npx --yes tsx --test src/utils/search.test.ts` (`4/4`), `npm run verify`, `tsc --noEmit`, and headless Chromium captures across Dark, Light, Desktop (`1440x900`), and Mobile (`390x844`).

## 2026-11-18 — Header UI Balance & Visual Polish

- Redesigned `src/layouts/HubLayout.astro` header into a balanced `h-14` (`56px`) 3-slot desktop grid (`md:grid-cols-[1fr_auto_1fr]`): left-aligned brand (`Vib Tools / Docs`), centered `w-72`/`lg:w-80` untruncated search bar (`Search documentation...`), and right-aligned external nav links with `ArrowUpRight` icons separated from `ThemeToggle` by a `1px` vertical hairline divider.
- Aligned `src/components/docs/Topbar.astro` (`lg:grid-cols-[1fr_auto_1fr]`, `h-14`, centered `320px` scoped search trigger, external CTA `ArrowUpRight` cue, hairline divider) and `src/components/ui/ThemeToggle.astro` (`size-8`, `cursor-pointer`) with consistent spacing and theme contrast.
- Verified `compile_applet`, `lint_applet`, `node scripts/verify-build.mjs`, and live headless Chromium captures across Hub/Docs (`1440x900` dark/light) and Mobile (`390x844`).

## 2026-11-18 — Home Hero & Compact 4-Column Footer UI

- Updated `src/pages/index.astro` with a compact split Hero powered by `manifest.json` (`Browse {primaryProject.title}` CTA, `Search docs` button wired to `[data-search-trigger]`, and right-side `Quick Guides` card populated via `buildQuickSuggestions`) plus a crisp `Documentation` count bar above the untouched `CategoryTabs` and `ProjectCard` grid.
- Upgraded `src/layouts/HubLayout.astro` footer (leaving `<header>` untouched) into a 4-column responsive structure (`Brand`, `Documentation`, `Resources` -> `/llms.txt` & `/sitemap-index.xml`, `Connect` -> `site.navLinks`) with a hairline copyright and domain hostname bar.
- Verified `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs` (`6` HTML files, `14` required assets, `0` broken links), `npx --yes tsx --test src/utils/search.test.ts` (`4/4`), and Chromium captures across Dark/Light Desktop (`1440x900`) and Mobile (`390x844`).

## 2026-11-18 — SEO-Phase 01: Core Technical SEO, `404` `noindex`, OpenGraph Article Type & `robots.txt`

- Added optional `ogType` and `robots` props, protocol-safe base origin normalization, `<meta property="og:image:alt">`, and `<link rel="sitemap" type="application/xml" href="/sitemap-index.xml">` to `src/layouts/BaseLayout.astro`.
- Forwarded optional `robots` prop through `src/layouts/HubLayout.astro`, enabled `robots="noindex, follow"` on `src/pages/404.astro`, and enabled `ogType="article"` on documentation routes in `src/layouts/DocsLayout.astro`.
- Added `Disallow: /pagefind/` to `src/pages/robots.txt.ts` so search bots skip Pagefind client WASM/index shards while keeping `Allow: /` and `Sitemap`.
- Verified `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs` (`6` HTML files, `14` required assets, `0` broken links), and inspected built `<head>` metadata across `dist/index.html`, `dist/404.html`, `dist/vib-docs-engine/index.html`, and `dist/robots.txt`.

## 2026-11-18 — SEO-Phase 02: Schema.org Structured Data (`JSON-LD`) & Safe Serializer

- Created `src/utils/seo.ts` (`resolveOrigin`, `resolveAbsoluteUrl`, `safeJsonLdStringify`, `buildHubJsonLd`, `buildDocJsonLd`) and `src/utils/seo.test.ts` with HTML script-breakout escaping and `node:test` coverage.
- Added optional `structuredData` injection in `src/layouts/BaseLayout.astro` and pass-through in `src/layouts/HubLayout.astro`.
- Emitted `Organization` + `WebSite` (`SearchAction` targeting `/?q={search_term_string}`) on `src/pages/index.astro`, and `TechArticle` + ordered `BreadcrumbList` on `src/layouts/DocsLayout.astro`.
- Verified `npx --yes tsx --test src/utils/seo.test.ts src/utils/search.test.ts` (`8/8` pass), `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs`, and `JSON.parse` validation on built `<script type="application/ld+json">` outputs.

## 2026-11-18 — SEO-Phase 03: AI Search Engine Indexes (`/llms-full.txt`, Per-Page `.md` & Edge Headers)

- Created shared `src/utils/llms.ts` helper (`resolveProductEntries`, `readCleanMarkdownBody`, `buildRootLlmsText`, `buildProductLlmsText`, `buildRootLlmsFullText`, `buildSingleDocMarkdownText`, `routeToMarkdownPath`) and refactored `src/pages/llms.txt.ts` and `src/pages/[product]/llms.txt.ts` to eliminate duplicate YAML-stripping logic.
- Added static root `/llms-full.txt` (`src/pages/llms-full.txt.ts`) and per-page clean Markdown routes (`src/pages/[product]/[...slug].md.ts` -> `/{product}/{slug}.md`).
- Added `<link rel="alternate">` AI discovery links (`/llms.txt`, per-page `.md`, and product `llms.txt`) in `src/layouts/BaseLayout.astro` and `src/layouts/DocsLayout.astro`, plus UTF-8 `text/plain` / `text/markdown` Cloudflare edge headers in `public/_headers`.
- Verified `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs` (`6` HTML files, `14` assets, `0` broken links), `dist/llms-full.txt` (`20,030` bytes), and all per-page `.md` exports.

## 2026-11-18 — SEO-Phase 04: `?q=` SearchAction Parity, Pagefind Tuning, Verifier & Docs Sync

- Added URL `?q=` query parameter handling in `src/components/ui/SearchModal.astro` so Google `SearchAction` (`/?q={search_term_string}`) links auto-open and populate Pagefind search safely (capped at `120` chars, cleaned via `history.replaceState` on close).
- Tuned Pagefind relevance in `src/layouts/DocsLayout.astro` with `data-pagefind-ignore="all"` on `<nav aria-label="Breadcrumb">` and `data-pagefind-weight="10"` on fallback article `<h1>`.
- Upgraded `scripts/verify-build.mjs` to enforce `/llms-full.txt`, per-page `.md` parity for every `flatPages` route, `<meta name="robots" content="noindex, ...">` on `dist/404.html`, and valid `JSON.parse()` on every `<script type="application/ld+json">` tag.
- Updated `src/MANIFEST.md`, `notes/010-seo-phase-execution-tracker.md`, `notes/012-actual-implementation-matrix.md`, and `project/04-codebase-reference.md`.
- Verified `npx --yes tsx --test src/utils/seo.test.ts src/utils/search.test.ts` (`8/8` pass), `compile_applet`, `lint_applet` (`tsc --noEmit`), `node scripts/verify-build.mjs` (`6` HTML files, `15` required assets, `0` broken links), and live Chromium `http://localhost:3000/?q=deployment` (`13` links, `0` console errors).





