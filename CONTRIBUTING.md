# Contributing

Vib Docs Engine is a configuration-driven static documentation engine. Keep changes focused, preserve the two-portal boundary, and avoid hardcoded product or category behavior.

## Before changing code

1. Read `AGENTS.md` and the relevant `project/` specifications.
2. Record a dated plan in `notes/` before implementation. Update `project/CHANGELOG.md` and the affected code map/spec after the change; update `docs/` when operator or reader behavior changes.
3. Keep product-authored docs in that product's repository. Do not hand-edit `src/content/docs/`, `src/generated/manifest.json`, or build output.

## Local setup and checks

Use Node.js 22 and Git with sparse-checkout support:

```sh
npm ci
npm run sync
npm run dev
```

Before proposing changes, run:

```sh
npx tsc --noEmit
npm run verify
```

Use the GitHub bug-report or feature-request form for public issue submissions, and use the pull-request template to document scope and verification. Do not include credentials, private URLs, tokens, or personal data in submissions.

`npm run verify` synchronizes configured repositories, builds the static site, indexes it with Pagefind, and validates generated files, manifest routes, and internal links. If a docs remote is unavailable, use a temporary `localPath` for verification and remove it before committing.

## Product and portal changes

- Use `npm run add-project` for a new product entry.
- Keep user/developer differences in the paired config files under `config/presets/`.
- Never add credentials to project URLs, source, or generated files.
- Use `npm run export-portal` to create a clean portal checkout; replace sample `YOUR_ORG` remotes before building.

For substantial changes, agree on scope in a repository issue or discussion when that facility is available. Follow the active repository's branch/review requirements; no contribution acceptance or response schedule is implied by this guide.
