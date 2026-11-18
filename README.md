# Vib Docs Engine (`vib-docs-engine`)

**One config-driven engine for fast, searchable documentation across Vib Tools products.**

Vib Docs Engine is an Astro static documentation engine that turns Markdown and MDX from product repositories into searchable product portals. It combines Astro, Tailwind CSS v4, Expressive Code, and Pagefind, with documentation fetched at build time through Git sparse checkout. The result is static HTML, CSS, assets, and a local search index; visitor browsers do not call Git or product APIs.

**Project description:** Build compact, SEO-ready documentation for multiple products from one maintainable codebase, without product-specific UI code changes.

**Maintained by:** Vib Tools · [GitHub organization](https://github.com/vibtoolshq) · [Project repository](https://github.com/JILLU-Games/vib-docs-engine)

## Contents

- [Why Vib Docs Engine](#why-vib-docs-engine)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configure Products](#configure-products)
- [Export the Two Portals](#export-the-two-portals)
- [Search and SEO](#search-and-seo)
- [Deployment](#deployment)
- [Project Documentation](#project-documentation)
- [Author and Contact](#author-and-contact)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Why Vib Docs Engine

Product teams should maintain documentation beside product code and publish updates by rebuilding a portal—not by editing application templates. One engine supports two separate deployments, distinguished by the paired files in `config/`:

| Portal                                                 | Audience                                                | Preset                        |
| ------------------------------------------------------ | ------------------------------------------------------- | ----------------------------- |
| [docs.vib.tools](https://docs.vib.tools)               | End users of desktop apps, web tools, and paid software | `config/presets/user-portal/` |
| [developer.vibtools.io](https://developer.vibtools.io) | SDKs, engines, modules, APIs, and self-hosted tools     | `config/presets/dev-portal/`  |

Portal identity, products, and categories are configuration data. The application does not hardcode user/developer product lists or category names.

## Features

- **Build-time Git sync:** Fetch only each configured `docsPath` with shallow Git sparse checkout. Git remotes work with GitHub, GitLab, Gitea, and Forgejo without provider API clients; a local docs path is available for tests.
- **Automatic metadata:** Read `title`, `description`, and `version` from `docs/index.md` frontmatter, with Markdown heading and project-config fallbacks.
- **Logo fallback:** Copy supported `logo.svg`, `logo.png`, `icon.svg`, or `icon.png` files from docs/assets/images. Without a logo, render a monogram.
- **Generated routes and navigation:** Recursively map Markdown/MDX and folders into product routes, remove numeric ordering prefixes from URLs, and generate a collapsible sidebar plus Previous/Next order.
- **Dynamic Hub:** Build product cards from the manifest and derive category tabs from project config. The category bar is hidden when there is one or fewer unique categories.
- **Three-column documentation reader:** Product switcher and CTA, responsive sidebar drawer, compact article column, breadcrumbs, expressive code blocks, callouts, code tabs, edit-on-Git, pagination, and a heading scroll-spy TOC.
- **Static search:** `Ctrl+K` / `Cmd+K` opens lazy-loaded Pagefind search. Search can be scoped to the current product or expanded to all products.
- **Themes and branding:** Persistent light/dark mode and a per-product accent color, with the site default as fallback.
- **SEO and AI endpoints:** Canonical/Open Graph metadata, `sitemap-index.xml`, `robots.txt`, global `/llms.txt`, and `/<product>/llms.txt` are generated at build time.
- **Release tooling:** `npm run add-project` adds validated config; `npm run export-portal` exports a user/dev deployment; `npm run verify` checks generated files, manifest routes, and internal links.
- **Deployment automation:** GitHub Actions and generic webhook templates notify protected Cloudflare Pages or VPS build hooks. Docker/Nginx assets serve the final static output.

## Architecture

```text
Product repository docs/
	│ push / build hook
	▼
scripts/sync-docs.mjs ── Git sparse checkout
	│                  metadata + logos + sidebar
	▼
src/content/docs/<slug>/ + src/generated/manifest.json
	│
	▼
Astro + Tailwind CSS v4 ── static HTML/CSS/assets
	│
	▼
Pagefind ── dist/pagefind/ ── static portal deployment
```

Authored product docs stay in each product repository. `src/content/docs/`, `src/generated/`, and synchronized `public/logos/` are generated and must not be hand-edited. See [project/01-architecture.md](project/01-architecture.md) for data flow, security boundaries, webhooks, Cloudflare Pages, and Docker/Nginx deployment details.

## Quick Start

Requirements: Node.js 22, npm, and Git with sparse-checkout support.

```sh
npm ci
npm run sync
npm run dev
```

The production pipeline and smoke-test suite are:

```sh
npm run verify
npm run preview
```

`npm run verify` runs the full sync → Astro static build → Pagefind pipeline, then checks required files, product routes, AI indexes, and root-relative links. `npm run preview` serves the completed build locally (usually at `http://localhost:4321/`).

For private HTTPS docs repositories, set `GIT_TOKEN` in the deployment secret store. Set `GIT_USERNAME` only when the Git host requires a username other than the default. Never put tokens in repository URLs, config, generated manifests, or browser-visible variables.

## Configure Products

Add a record to `config/projects.json`, or run `npm run add-project`. Categories are arbitrary strings derived from project records. A project normally supplies `slug`, `category`, `accentColor`, `repoUrl`, `branch`, `docsPath`, and optional CTA/fallback metadata. Its repository should contain `docs/index.md` and nested Markdown/MDX pages/assets.

See [docs/adding-projects.md](docs/adding-projects.md) for frontmatter, local testing, logos, presets, and automatic rebuild hooks.

## Export the Two Portals

Export each preset into a new sibling directory:

```sh
npm run export-portal -- --portal user --out ../docs-vib-tools
npm run export-portal -- --portal dev --out ../developer-vibtools-io
```

Replace the `YOUR_ORG` sample repository URLs before the first build. Deploy each exported repository separately with its own portal config, secrets, product repositories, and build hook. Full instructions are in [docs/deployment.md](docs/deployment.md).

## Search and SEO

Pagefind indexes only documentation article bodies and stores its index locally under `dist/pagefind/`. Product pages start with product-scoped search; the Hub starts globally. The build also emits canonical metadata, a sitemap index, crawler rules, and plain-text AI indexes at `/llms.txt` and `/<product>/llms.txt`.

## Deployment

Cloudflare Pages: use `npm run build` with `dist/` as the output directory. Self-hosted VPS/Coolify: build with the repository's multi-stage `Dockerfile` and serve with `nginx.conf`. Product repositories can copy `templates/github-notify-docs.yml` into `.github/workflows/` and set `DOCS_DEPLOY_HOOK_URL` as a protected Actions secret.

## Project Documentation

- [Vision and non-negotiable rules](project/00-vision-and-purpose.md)
- [System architecture](project/01-architecture.md)
- [Features and workflows](project/02-features-and-workflow.md)
- [UI design system](project/03-ui-design-system.md)
- [Codebase and function reference](project/04-codebase-reference.md)
- [Engineering change log](project/CHANGELOG.md)
- [Operator guide](docs/index.md)
- [Portal user guide](docs/portal-user-guide.md)
- [Go-live deployment runbook](docs/deployment.md)

## Author and Contact

Vib Tools builds practical desktop applications, self-hosted software, automation tools, developer utilities, reusable frameworks, and open-source projects for real workflows. This repository's verified author/maintainer identity is the Vib Tools organization; it does not assert an individual founder, CEO, or legal-owner title.

- Website: [vib.tools](https://vib.tools/)
- GitHub: [@vibtoolshq](https://github.com/vibtoolshq)
- GitLab: [vibtools](https://gitlab.com/vibtools)
- General inquiries and partnerships: [hello@vibtools.io](mailto:hello@vibtools.io)
- Product and technical support: [support@vibtools.io](mailto:support@vibtools.io)
- Phone / WhatsApp: [+880 1795-470603](tel:+8801795470603)
- Office: 5660 Kochakata, Nageswari, Kurigram, Rangpur, Bangladesh (GMT+6)
- Social: [X](https://x.com/vibtools) · [Facebook](https://www.facebook.com/vib.tools) · [Instagram](https://www.instagram.com/vib.tools/) · [Reddit](https://www.reddit.com/user/VibTools/) · [TikTok](https://www.tiktok.com/@vibtools)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), and the relevant project specifications before changing the engine. Use `npm run add-project` for new catalog entries, keep product documentation in its product repository, and run `npm run verify` before proposing an engine change. Do not include credentials or private project data in issues, pull requests, or documentation.

## Security

Do not report suspected vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) for private disclosure and check the affected product repository's own policy for product-specific reports.

## License

No `LICENSE` file was present when this repository was audited. Do not infer reuse or redistribution rights from public GitHub visibility; check the repository for a license before using or distributing the code.
