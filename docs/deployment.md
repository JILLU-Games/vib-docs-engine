# Go-Live Deployment Runbook

This runbook exports the single engine into independent user and developer portal repositories, verifies the static build, and connects product repositories to protected deployment hooks. Each portal owns its own config, Git credentials, project registry, and webhook URL.

## 1. Split into two portals

Run these commands from the engine repository root. The output directories must not already exist:

```sh
npm run export-portal -- --portal user --out ../docs-vib-tools
npm run export-portal -- --portal dev --out ../developer-vibtools-io
```

The exporter copies the engine source while excluding dependencies, build output, generated documentation, generated logos, and the presets directory. It installs the matching preset files as each export's active `config/site.config.json` and `config/projects.json`, while preserving the `.gitkeep` files in generated folders.

Before building, replace all `YOUR_ORG` repository URLs in the user and developer presets with real documentation repositories. Review each CTA, category, branch, and `docsPath`. Then initialize and push each exported directory to its own deployment repository:

```sh
cd ../docs-vib-tools
git init
npm install
npm run build
```

Repeat for `../developer-vibtools-io`. Never copy generated content or credentials from one portal to the other.

## 2. Deploy with Cloudflare Pages

Create a separate Pages project for each exported Git repository.

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js environment variable: `NODE_VERSION=22`
- Add `GIT_TOKEN` as a protected Pages environment secret if a configured docs repository is private. Add `GIT_USERNAME` only if that Git host needs a non-default username.
- Attach `docs.vib.tools` to the user portal and `developer.vibtools.io` to the developer portal.
- Add a Cloudflare redirect rule for the legacy `docs.vibtools.io` hostname: match `docs.vibtools.io/*`, redirect to `https://docs.vib.tools/$1`, status `301`.

Create a separate protected Pages build hook for each portal. Product repository webhooks must call only the portal whose registry contains that product.

## 3. Deploy to a VPS with Docker or Coolify

The repository's multi-stage `Dockerfile` builds the static site in `node:22-alpine` and copies only `dist/` into `nginx:alpine`. `nginx.conf` enables gzip, long-lived caching for fingerprinted Astro/Pagefind assets, and the static 404 route.

For private docs repositories, provide a BuildKit secret rather than committing a token or putting it in the final image:

```sh
docker buildx build --secret id=git_token,env=GIT_TOKEN -t vib-docs-engine:latest .
docker run --rm -p 8080:80 vib-docs-engine:latest
```

In Coolify, configure the Git repository, Dockerfile build, port `80`, portal domain, and `GIT_TOKEN` as a build secret/environment secret. Use separate services and secrets for the two portals. Configure a protected webhook or CI trigger to rebuild the right service. The webhook receiver must verify signatures, rate-limit requests, and publish only a successfully built image; Nginx serves static files and never fetches docs at request time.

## 4. Connect product repositories

For a GitHub product repository, copy `templates/github-notify-docs.yml` to `.github/workflows/notify-docs.yml`. Add the repository Actions secret `DOCS_DEPLOY_HOOK_URL` with the protected build-hook URL for the correct portal. The workflow listens for pushes to `main` that modify `docs/**` and sends a POST request to the hook.

For GitLab, Gitea/Forgejo, or a VPS receiver, use `templates/webhook-trigger.sh` as the curl request. Store `DOCS_DEPLOY_HOOK_URL` as a protected CI/webhook secret. Configure source-host signature verification and path/event filters where available; do not expose hook URLs in logs or source code.

## Final launch checks

Before DNS cutover, run `npm run verify` in each portal repository. Confirm the selected preset and real repository URLs, private-repo access, static routes, Pagefind index, sitemap, robots, global and per-product `llms.txt`, and 404 output. Test one product docs push and confirm only its intended portal rebuilds. Preview a local build with `npm run preview` before publishing changes.
