---
title: Vib Docs Engine
description: A static multi-product documentation engine.
version: "0.1.0"
---

# Operating vib-docs-engine

`vib-docs-engine` builds static documentation portals for multiple products. Configuration selects the portal identity and product repositories. During a build, the engine fetches only configured documentation directories with Git sparse checkout, validates and normalizes content, generates a manifest/sidebar tree, and then builds Astro static pages and a local Pagefind search index.

The engine includes the Astro/Tailwind configuration, Content Collection schema, Git sync/manifest engine, Hub, three-column docs reader, Pagefind search, sitemap, robots, and AI-readable `llms.txt` endpoints. The production build prerenders the configured portal to static files; the browser does not call Git or documentation APIs.

## Prerequisites for the implemented engine

- A Node.js release supported by the installed Astro version and npm.
- Git with sparse-checkout support (Git 2.25 or newer).
- Network access to the configured source repositories; credentials only when private repositories require them.

## Local workflow

1. Install dependencies using `npm install` (or `npm ci` from the lockfile in CI).
2. Set `GIT_TOKEN` in the process environment or deployment secret store when private HTTPS repositories require it. Set `GIT_USERNAME` only when the Git host requires a different token username. Never commit credentials or put them in public build variables.
3. Run `npm run sync` to synchronize docs and regenerate `src/generated/manifest.json`.
4. Run `npm run dev` to sync automatically, then start Astro's development server on `0.0.0.0:3000`.
5. Run `npm run build` to sync, build Astro, and run Pagefind. `npm run preview` previews an existing Astro build on `0.0.0.0:3000`.

The `predev` and `prebuild` lifecycle hooks run the sync script automatically. When syncing the engine's own `vib-docs-engine` record without remote Git credentials, `scripts/sync-docs.mjs` falls back to the in-repository `docs/` directory. `localPath` can also temporarily target a local folder (for example `./docs`) for an isolated sync test; keep it out of production config. Generated content and manifests are ignored build inputs and must not be hand-edited.

Press `Ctrl+K` (or `Cmd+K` on macOS) anywhere to open search. On a product page, search starts scoped to that product; switch to “All Docs” for portal-wide results. Hub searches are global. The Pagefind index is local and is generated during production builds; dev mode displays a note if no index exists yet.

Static AI indexes are available at `/llms.txt` and `/<product-slug>/llms.txt`. `robots.txt` allows crawlers and points to `/sitemap-index.xml`. Unknown paths use the compact static 404 page.

## Configuration overview

- `config/site.config.json` controls portal title, subtitle, canonical domain, brand identity, default accent, `portalType` (`"users"`, `"developer"`, or `"all"`), and navigation.
- `config/projects.json` accepts bare Git repository URLs (`"https://..."`) for repos that include `.vibtools/docs.config.json` (or `.vibtools/config.docs.json`), or override objects with explicit fields and private-repo `secretKey` references.
- `.vibtools/docs.config.json` (alias `.vibtools/config.docs.json`) lets any repository declare its own `docsType`, dual `targets.users` / `targets.developer`, `docsPath`, `logoPath`, `slug`, `category`, `title`, `description`, `version`, `accentColor`, and CTA metadata in one place.
- Categories are derived from resolved products. Adding a category does not require code changes.

Synchronized files under `src/content/docs/`, generated data under `src/generated/`, and synchronized logos under `public/logos/` are build artifacts and are ignored by Git except for `.gitkeep` files. Do not edit generated files by hand.

## Deployment

Configure the host to build from the portal's own deployment repository. A documentation source repository webhook should trigger the host's protected build hook; the build fetches `.vibtools/` and only the matching documentation directories with 2-step Git sparse checkout, then publishes a complete static output. For Cloudflare Pages, set the build command to `npm run build`, the output directory to `dist`, and use a protected Pages build hook. For a self-hosted VPS, build the Docker image and have Nginx serve only the resulting static files. The receiver must verify webhook authenticity and avoid exposing a shell command publicly. Build into staging and replace live output only after all build steps succeed.

For private repositories, pass `GIT_TOKEN` as a BuildKit secret rather than a committed file or Docker `ENV` value. Example: `docker buildx build --secret id=git_token,env=GIT_TOKEN -t vib-docs-engine .`. The final Nginx image contains only `dist/` and Nginx configuration. Run it with `docker run --rm -p 8080:80 vib-docs-engine` and visit `http://localhost:8080`.

See [`.vibtools/` Configuration](vibtools-config.md) for the complete `docs.config.json` / `config.docs.json` schema, [Adding Projects](adding-projects.md) for CLI and webhook steps, [Go-Live Deployment](deployment.md) for dual-portal hosting, and `project/` for architecture contracts.
