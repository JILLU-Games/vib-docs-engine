---
title: ".vibtools/ Configuration"
description: "All-in-one repository configuration schema (docs.config.json and config.docs.json) for single and dual-portal Vib Docs Engine sync."
---

# `.vibtools/` Repository Configuration

Place a `.vibtools/` folder in the root of any product repository so **Vib Docs Engine** can discover its documentation path, portal audience, title, description, version, accent color, CTA links, and brand logo from a single repository URL in `config/projects.json`.

---

## 1. Directory layout & filenames

```text
your-product-repo/
├── .vibtools/
│   ├── docs.config.json      # Canonical filename (or config.docs.json)
│   └── logo.svg              # Optional brand icon (.svg / .png)
├── docs/
│   ├── users/                # Optional audience-specific docs directory
│   └── developer/            # Optional developer docs directory
└── ...
```

- **Canonical config file:** `.vibtools/docs.config.json`
- **Supported alias:** `.vibtools/config.docs.json`
- **Conflict rule:** Commit **either** `docs.config.json` **or** `config.docs.json` inside `.vibtools/`. Keeping both files simultaneously causes `scripts/sync-docs.mjs` and `scripts/verify-build.mjs` to fail cleanly rather than guess which file is authoritative.
- **Two-step Git sparse checkout:** During `npm run sync`, remote repositories first check out only `.vibtools/` on the registry entry's branch (`main` by default). Once `docsType` / `targets` match the portal's `portalType` (`users`, `developer`, or `all`), if the resolved target defines a different `branch`, `scripts/sync-docs.mjs` fetches and switches to that branch before sparse-checking out only the resolved `docsPath` (and custom `logoPath` parent folder, if outside `docsPath`). Application source code is never checked out.

---

## 2. Config file reference (`docs.config.json` / `config.docs.json`)

Every field below is verified by `src/utils/vibtoolsConfig.ts` during sync and `npm run verify`:

| Field | Type | Applies To | Default / Behavior |
| :--- | :--- | :--- | :--- |
| `schemaVersion` | `1` | Root | Optional format marker (`1`). Any other value fails validation. |
| `docsType` | `"users" \| "developer" \| "both"` | Root | Optional audience filter (`"both"` when omitted). Matched against `config/site.config.json` `portalType` (`"users"`, `"developer"`, or `"all"`). |
| `slug` | `string` | Root or Target | Lowercase URL-safe slug (`^[a-z0-9]+(?:-[a-z0-9]+)*$`). Defaults to normalized repository name from `repoUrl` when omitted. |
| `title` | `string` | Root or Target | Product card and navigation title fallback when Markdown frontmatter does not specify `title`. |
| `category` | `string` | Root or Target | Hub filter category label. Defaults to `"Developer Docs"` for `developer` targets or `"Documentation"` otherwise. |
| `description` | `string` | Root or Target | Short summary for Hub card and SEO fallback when frontmatter lacks `description`. |
| `version` | `string \| number` | Root or Target | Displayed release/version badge (stored as trimmed string, e.g. `"1.2.0"`). |
| `accentColor` | `string` | Root or Target | 3, 4, 6, or 8 digit CSS hex color (e.g. `"#7C3AED"`). Falls back to `site.defaultAccent`. |
| `docsPath` | `string` | Root or Target | Relative POSIX directory path inside the repository (no leading `/`, no `\`, no `..`, not `.`). Defaults to `"docs"`. |
| `logoPath` | `string` | Root or Target | Relative POSIX file path inside the repository (e.g. `".vibtools/logo.svg"`). Checked first before standard logo auto-discovery. |
| `branch` | `string` | Root or Target | Git branch to sparse-clone (`"main"` when omitted; spaces, `\`, and `..` rejected). |
| `ctaLabel` | `string` | Root or Target | Button label shown in the top bar (defaults to `"Open"` when `ctaUrl` is set without `ctaLabel`). |
| `ctaUrl` | `string` | Root or Target | External HTTP or HTTPS CTA link (`ctaLabel` is ignored unless `ctaUrl` is set). |
| `targets` | `{ users?: Target; developer?: Target }` | Root | Optional per-portal overrides so one repository can serve `docs.vib.tools` and `developer.vibtools.io` with different `docsPath`, `slug`, `category`, `title`, `description`, `accentColor`, `logoPath`, `ctaUrl`, or `branch`. Must define at least one of `users` or `developer`. |

---

## 3. Portal filtering & metadata precedence

### Portal matching rules

`config/site.config.json` defines `"portalType"`:
- `"users"` (e.g., `docs.vib.tools`): Includes entries whose `.vibtools/` has `targets.users`, `docsType: "users"`, or `docsType: "both"` (or legacy repos without `.vibtools/` unless `docsType: "developer"`). Developer-only repositories in a shared list are cleanly skipped (`Skipped ...`), not treated as build errors.
- `"developer"` (e.g., `developer.vibtools.io`): Includes entries whose `.vibtools/` has `targets.developer`, `docsType: "developer"`, or `docsType: "both"`. User-only repositories are skipped.
- `"all"` (default combined engine config): Includes all entries; if a repository defines both `targets.users` and `targets.developer`, setting an override `"docsType": "developer"` or `"docsType": "users"` on that entry in `config/projects.json` selects that matching target cleanly (otherwise `targets.users` is preferred). If a repository defines only one key under `targets`, that target is selected automatically.

### Resolution priority

1. **Portal registry override:** Fields explicitly set on an object inside `config/projects.json` always take highest precedence.
2. **`.vibtools/` active target:** `targets.users` or `targets.developer` matching the portal's `portalType`.
3. **`.vibtools/` root fields:** Shared root properties in `docs.config.json` / `config.docs.json`.
4. **Markdown frontmatter & Smart Markdown extraction:** For `title`, `description`, and `version` at render time, `scripts/sync-docs.mjs` resolves `index.md` YAML frontmatter -> `.vibtools/` / `projects.json` metadata -> **Smart Markdown extraction** (first `# H1` heading stripped of trailing `— User Documentation` / `— Docs` suffixes, first clean prose paragraph capped cleanly to `~160` chars, and semantic `vX.Y.Z` / `Version: X.Y.Z` detection).

This means standard Markdown docs without YAML frontmatter still populate clean titles, summaries, and version badges on the Hub automatically.

---

## 4. Logo discovery & security rules

When `scripts/sync-docs.mjs` resolves a product logo, it checks paths in this order:
1. Explicit `logoPath` (from `projects.json` -> `.vibtools/` target -> `.vibtools/` root)
2. `.vibtools/logo.svg`, `.vibtools/logo.png`, `.vibtools/icon.svg`, `.vibtools/icon.png`
3. `<docsPath>/logo.*`, `<docsPath>/icon.*`, `<docsPath>/assets/*`, `<docsPath>/images/*`

Security & validation checks enforced on every logo candidate:
- Must resolve inside the repository root (`assertWithin`) with zero symlinks (`fs.lstat`).
- Maximum file size is `2 MB`.
- `.png` files must carry valid 8-byte PNG headers.
- `.svg` files must reject `<script>`, `<foreignObject>`, inline `on*=` attributes, and external `href` / `xlink:href` / `src` URIs.
- Invalid or missing custom logos log a warning and fall back cleanly to standard discovery or a UI monogram instead of breaking the docs build.

---

## 5. Copy-paste templates

### Example A — Single portal (End-user app on `docs.vib.tools`)

```json
{
  "schemaVersion": 1,
  "docsType": "users",
  "slug": "calgrid",
  "title": "CalGrid",
  "category": "Desktop Apps",
  "description": "Batch Google Calendar scheduling and deliverability workflows.",
  "version": "1.0.2",
  "accentColor": "#2563EB",
  "docsPath": "docs",
  "logoPath": ".vibtools/logo.png",
  "ctaLabel": "Get CalGrid",
  "ctaUrl": "https://vib.tools/calgrid"
}
```

### Example B — Developer tool / SDK (Developer portal on `developer.vibtools.io`)

```json
{
  "schemaVersion": 1,
  "docsType": "developer",
  "slug": "vib-docs-engine",
  "title": "Vib Docs Engine",
  "category": "Core Engine",
  "description": "A static multi-product documentation engine.",
  "version": "0.1.0",
  "accentColor": "#7C3AED",
  "docsPath": "docs",
  "logoPath": ".vibtools/logo.png",
  "branch": "main",
  "ctaLabel": "View repository",
  "ctaUrl": "https://github.com/JILLU-Games/vib-docs-engine"
}
```

### Example C — Dual-portal repository (One repo serving both domains)

```json
{
  "schemaVersion": 1,
  "docsType": "both",
  "title": "Invio",
  "version": "2.4.0",
  "logoPath": ".vibtools/logo.svg",
  "targets": {
    "users": {
      "slug": "invio",
      "category": "Desktop Apps",
      "description": "Desktop guides and workspace setup for Invio.",
      "accentColor": "#7C3AED",
      "docsPath": "docs/users",
      "ctaLabel": "Download",
      "ctaUrl": "https://vib.tools/invio"
    },
    "developer": {
      "slug": "invio-sdk",
      "title": "Invio SDK",
      "category": "SDKs & Engines",
      "description": "Plugin API, CLI hooks, and webhook integration reference.",
      "accentColor": "#0EA5E9",
      "docsPath": "docs/developer",
      "ctaLabel": "GitHub",
      "ctaUrl": "https://github.com/vibdocs/invio-docs"
    }
  }
}
```

### Minimal `config/projects.json` registration

When the product repo includes `.vibtools/docs.config.json` (or `.vibtools/config.docs.json`), `config/projects.json` needs only the repository URL string:

```json
[
  "https://github.com/vibdocs/calgrid.git",
  "https://github.com/vibdocs/invio-docs.git",
  {
    "repoUrl": "https://github.com/my-org/private-sdk.git",
    "secretKey": "$GIT_TOKEN_PRIVATE_SDK"
  }
]
```

Or register via CLI in one command:

```sh
npm run add-project -- --url https://github.com/vibdocs/calgrid.git
```

---

## 6. JSON Schema reference (Draft 2020-12)

Editors supporting `$schema` or local schema validation can reference the canonical contract enforced by `parseVibtoolsRepoConfig` in `src/utils/vibtoolsConfig.ts`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "VibToolsDocsConfig",
  "type": "object",
  "properties": {
    "schemaVersion": { "const": 1 },
    "docsType": { "enum": ["users", "developer", "both"] },
    "slug": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    "title": { "type": "string", "minLength": 1 },
    "category": { "type": "string", "minLength": 1 },
    "description": { "type": "string", "minLength": 1 },
    "version": { "type": ["string", "number"] },
    "accentColor": {
      "type": "string",
      "pattern": "^#(?:[\\da-fA-F]{3}|[\\da-fA-F]{4}|[\\da-fA-F]{6}|[\\da-fA-F]{8})$"
    },
    "docsPath": { "type": "string", "minLength": 1 },
    "logoPath": { "type": "string", "minLength": 1 },
    "branch": { "type": "string", "minLength": 1 },
    "ctaLabel": { "type": "string", "minLength": 1 },
    "ctaUrl": { "type": "string", "format": "uri" },
    "targets": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": false,
      "properties": {
        "users": { "$ref": "#/$defs/target" },
        "developer": { "$ref": "#/$defs/target" }
      }
    }
  },
  "$defs": {
    "target": {
      "type": "object",
      "properties": {
        "slug": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        "title": { "type": "string", "minLength": 1 },
        "category": { "type": "string", "minLength": 1 },
        "description": { "type": "string", "minLength": 1 },
        "version": { "type": ["string", "number"] },
        "accentColor": {
          "type": "string",
          "pattern": "^#(?:[\\da-fA-F]{3}|[\\da-fA-F]{4}|[\\da-fA-F]{6}|[\\da-fA-F]{8})$"
        },
        "docsPath": { "type": "string", "minLength": 1 },
        "logoPath": { "type": "string", "minLength": 1 },
        "branch": { "type": "string", "minLength": 1 },
        "ctaLabel": { "type": "string", "minLength": 1 },
        "ctaUrl": { "type": "string", "format": "uri" }
      }
    }
  }
}
```
