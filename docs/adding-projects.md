# Adding Projects

A product is added through configuration and a documentation repository. The intended workflow requires no application source changes.

## 1. Prepare the source repository

Create a `docs/` directory (or choose another path) in the repository's configured branch. Add an `index.md` with YAML frontmatter at the very top:

```md
---
title: Product Name
description: A concise description of this product.
version: "1.2.0"
---

# Product Name

Start the documentation here.
```

The `title`, `description`, and `version` values are plain text metadata. Keep descriptions concise. Ensure YAML is valid and use a quoted value if punctuation could be interpreted as YAML syntax. Nested Markdown/MDX files become nested documentation pages.

Optionally add a product logo as `docs/logo.svg` or `docs/logo.png`. SVG is preferred. Keep SVGs static and self-contained; the engine should validate assets and render untrusted SVGs as image files, not inject their markup into the page. If no supported logo exists, the UI generates a monogram.

## 2. Add a project record

Append an object to the JSON array in `config/projects.json`. Example:

```json
{
  "slug": "product-name",
  "category": "Developer Tools",
  "accentColor": "#22C55E",
  "repoUrl": "https://git.example.com/team/product-name.git",
  "secretKey": "$GIT_TOKEN",
  "branch": "main",
  "docsPath": "docs",
  "ctaLabel": "View repository",
  "ctaUrl": "https://git.example.com/team/product-name",
  "title": "Product Name",
  "description": "Optional fallback if index.md has no description.",
  "version": "1.2.0"
}
```

Required fields are `slug`, `category`, `accentColor`, and `repoUrl` (unless `localPath` is used for local testing). `branch` defaults to `main`; `docsPath` defaults to `docs`. `secretKey` (or `gitToken` / `gitTokenEnv`) and `gitUsername` are optional fields used only for private repositories—omit them or leave them blank for public repositories. `title`, `description`, and `version` are optional fallbacks for missing frontmatter values.

Use a unique, URL-safe slug. Choose any category label that makes sense; category filters are derived dynamically from this file and do not require a fixed list. Use a valid CSS color for `accentColor`. Repository URLs may use supported Git HTTPS or SSH transports for GitHub, GitLab, Gitea, or Forgejo. Do not place credentials inside `repoUrl`.

## 3. Configure public vs. private repository access

- **Public repositories:** require no `secretKey` or `GIT_TOKEN`. Leave `secretKey` omitted and `scripts/sync-docs.mjs` clones the repository directly without credentials.
- **Private repositories:** set `secretKey` on the project in `config/projects.json` (either an environment variable reference such as `"$GIT_TOKEN"` / `"GIT_TOKEN"` or a read-only token, plus optional `gitUsername` if your Git host requires a custom username; GitLab defaults to `oauth2` and GitHub/Gitea/Forgejo default to `x-access-token`). `scripts/sync-docs.mjs` automatically strips `secretKey`, `gitToken`, `gitTokenEnv`, and `gitUsername` before writing `src/generated/manifest.json` and redacts them from logs.

## 4. Configure rebuild webhooks

The build-time sync and portal build scripts are in place. Configure the source host to trigger the portal's protected build hook on pushes to the configured branch when files under the documentation path change. A full push webhook may be used if path filtering is unavailable; the sync process still fetches only the configured subtree.

- **Cloudflare Pages:** create a Pages build hook for the appropriate deployment and configure a repository webhook to call it. Restrict events to pushes where supported and protect the hook URL as a secret.
- **Docker/Nginx VPS:** use CI or a small protected webhook receiver to validate the provider's signature and start the build pipeline. Do not expose an unauthenticated shell endpoint. Build to a staging directory and atomically switch the served static output only after sync, validation, Astro, and Pagefind all succeed.

For GitHub, GitLab, Gitea, and Forgejo, webhook event/signature settings differ by host. The site build itself must remain platform-neutral and use Git transport, not provider APIs.

## 5. Verify sync and the portal

Run `npm run sync`, then `npm run build`. Confirm the product appears on the Hub, metadata/fallbacks and logo/monogram are correct, nested routes/sidebar/pagination and the Edit link are valid, and Pagefind indexes the docs article body. On a product page, `Ctrl+K` should search that product by default; switch to “All Docs” to search every product. On the Hub, `Ctrl+K` searches globally. Check `/llms.txt`, `/<slug>/llms.txt`, `/robots.txt`, `/sitemap-index.xml`, and an unknown path for the 404 page.

Use `npm run preview` to inspect the built static portal locally. For VPS testing, build with `docker buildx build --secret id=git_token,env=GIT_TOKEN -t vib-docs-engine .` when private Git access is required, then run `docker run --rm -p 8080:80 vib-docs-engine`. Inspect the static output before publishing.

## 6. Use the project CLI

Run `npm run add-project` from the engine repository. The CLI validates a unique lowercase slug, shows configured categories as suggestions, accepts a Git HTTPS/SSH remote or a local docs path for testing, and prompts for branch, accent, and optional CTA details. It writes the entry to `config/projects.json` without changing application source. For local paths, keep the entry temporary and remove `localPath` before committing a production configuration.

After the prompt completes, follow the printed next step: run `npm run build` locally, or commit and push the config change to trigger the portal's connected deployment.

## 7. Select a portal preset

The engine includes paired starter configs:

- `config/presets/user-portal/` for `docs.vib.tools`.
- `config/presets/dev-portal/` for `developer.vibtools.io`.

For each deployment repository, copy both files from exactly one preset into `config/site.config.json` and `config/projects.json`. Do not mix the site config from one preset with the product registry from the other. Replace the sample `YOUR_ORG` repository URLs with real docs repositories before deploying, and keep each portal's product list isolated.

## 8. Automate rebuilds from product repositories

For GitHub, copy `templates/github-notify-docs.yml` into the product repository at `.github/workflows/notify-docs.yml`. Create a repository Actions secret named `DOCS_DEPLOY_HOOK_URL` with the protected build-hook URL for the correct portal. The workflow runs on pushes to `main` that change `docs/**` and sends a POST request without printing the secret.

For GitLab, Gitea/Forgejo, or a VPS webhook receiver, use `templates/webhook-trigger.sh` as the curl request body/script and configure `DOCS_DEPLOY_HOOK_URL` as a protected secret variable. The receiver must validate the host's webhook signature, rate-limit requests, and enqueue a build; never expose an unauthenticated shell endpoint.
