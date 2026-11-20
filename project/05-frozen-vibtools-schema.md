# 05. Frozen `.vibtools/` Docs Configuration Schema (Final & Immutable)

- **Status:** **FINAL & FROZEN** (`schemaVersion: 1`, frozen on `2026-11-20`)
- **Canonical Schema URL (`$id`):** `https://docs.vib.tools/schemas/vibtools-docs.schema.json`
- **Mirror Developer Portal Endpoint:** `https://developer.vibtools.io/schemas/vibtools-docs.schema.json`
- **Authority:** **Immutable without explicit Repository Owner order.**

---

## 1. Non-Negotiable Change-Lock Policy (For All AI Agents & Developers)

This `.vibtools/` schema (`VibToolsDocsConfig`, `schemaVersion: 1`) is **permanently frozen** as the single shared contract across **both** documentation portals:

1. **Users Documentation Portal (`https://docs.vib.tools` — `portalType: "users"`)**
2. **Developer Documentation Portal (`https://developer.vibtools.io` — `portalType: "developer"`)**

### Mandatory Lock Rules

- **NO unsolicited schema changes:** When performing any bug fix, UI change, build fix, dependency upgrade, refactor, SEO update, or feature task, **AI agents and contributors MUST NOT modify, rename, weaken, deprecate, or remove** any field, enum value, regex constraint, `additionalProperties: false` guard, target resolution priority, or `/schemas/vibtools-docs.schema.json` output defined below.
- **Explicit Owner Order Required:** Only an explicit, direct written order from the Repository Owner authorizing a change to the `.vibtools/` schema may unlock this file or its implementing runtime code (`src/utils/vibtoolsConfig.ts` and `src/pages/schemas/vibtools-docs.schema.json.ts`).
- **Preserve Cross-Portal Backward Compatibility:** Existing product repositories across `https://github.com/vibdocs/*` (for example `CalGrid`) and `https://github.com/vibtoolshq/*` (for example `ReadBox`, `LicenX`, `SocketCore`, `KronOTP`, `UpdatePilot`, `VPS-MCP`, `docscaffold`) rely on this exact frozen schema remaining unchanged. Any code change that breaks parsing or validation of repositories conforming to this frozen schema is a **regression bug** and must be reverted or fixed without altering the schema contract.

### Protected Implementation Locations (Do Not Alter Schema Behavior)

| Component | File | Locked Responsibility |
| --- | --- | --- |
| Schema validator & builder | `src/utils/vibtoolsConfig.ts` | `PORTAL_TYPES`, `DOCS_TYPES`, `VIBTOOLS_DIR`, `VIBTOOLS_CONFIG_FILENAMES`, `VIBTOOLS_SCHEMA_PATH`, `parseVibtoolsRepoConfig`, `resolvePortalProjectConfig`, `buildVibtoolsJsonSchema` |
| Hosted JSON Schema route | `src/pages/schemas/vibtools-docs.schema.json.ts` | Serves exact Draft 2020-12 JSON Schema at `/schemas/vibtools-docs.schema.json` |
| Git sparse-checkout sync | `scripts/sync-docs.mjs` | Reads `.vibtools/docs.config.json` (or `.vibtools/config.docs.json`), filters by `portalType`, checks out resolved `docsPath` + `logoPath` |
| Build & schema verifier | `scripts/verify-build.mjs` | Enforces `.vibtools/` conflict/schema/path checks and verifies `dist/schemas/vibtools-docs.schema.json` |

---

## 2. How Both Portals Collect `docs/` Under This Frozen Schema

Every product repository stores its own configuration inside `.vibtools/docs.config.json` (or alias `.vibtools/config.docs.json` — never both files simultaneously) and stores its Markdown/MDX documentation inside the repository's configured `docsPath` (default `"docs"`).

During build (`scripts/sync-docs.mjs`):

1. **Step 1 — Metadata-only Sparse Checkout:** The engine clones only `.vibtools/` from the repository and validates the JSON strictly against this frozen schema (`parseVibtoolsRepoConfig`).
2. **Step 2 — Portal Filtering (`portalType` vs `docsType` / `targets`):**
   - **On `docs.vib.tools` (`"portalType": "users"`):**
     - Collects repositories whose `.vibtools/` defines `targets.users`, OR sets `docsType` to `"users"` or `"both"` (unless `targets` only defines `developer`).
     - Skips repositories whose `docsType` is `"developer"` (and `targets.users` is absent).
   - **On `developer.vibtools.io` (`"portalType": "developer"`):**
     - Collects repositories whose `.vibtools/` defines `targets.developer`, OR sets `docsType` to `"developer"` or `"both"` (unless `targets` only defines `users`).
     - Skips repositories whose `docsType` is `"users"` (and `targets.developer` is absent).
   - **On `"portalType": "all"`:** Collects all configured repositories (selecting `targets.users` by default when both targets exist unless `config/projects.json` specifies `"docsType"`).
3. **Step 3 — Documentation & Logo Checkout:** The engine expands sparse checkout solely to the resolved `docsPath` (e.g., `docs`, `docs/users`, `docs/dev`) and `logoPath` (e.g., `.vibtools/logo.svg`, `.vibtools/logo.png`, or a valid custom relative PNG/SVG path), never checking out private or unrelated application source directories.
4. **Precedence Order:**
   - Field overrides (`slug`, `docsPath`, `logoPath`, `branch`, `category`, `accentColor`, `ctaLabel`, `ctaUrl`): `config/projects.json` entry override -> `.vibtools/` active target (`targets.users` or `targets.developer`) -> `.vibtools/` root -> engine defaults (`branch: "main"`, `docsPath: "docs"`, derived `slug`).
   - Display metadata (`title`, `description`, `version`): resolved `.vibtools/` / registry metadata -> root `index.md` YAML frontmatter -> Smart Markdown Extraction (`extractMarkdownMetadata`).

---

## 3. Canonical Frozen JSON Schema (Draft 2020-12 — Byte-for-Byte Exact)

The following JSON Schema is the **exact, final, frozen contract** emitted by `buildVibtoolsJsonSchema()` at `https://docs.vib.tools/schemas/vibtools-docs.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://docs.vib.tools/schemas/vibtools-docs.schema.json",
  "title": "VibToolsDocsConfig",
  "description": "Canonical repository configuration schema (.vibtools/docs.config.json or .vibtools/config.docs.json) for Vib Docs Engine single-portal and dual-portal (docs.vib.tools & developer.vibtools.io) synchronization.",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string",
      "description": "Optional URI pointing to this JSON Schema (e.g. 'https://docs.vib.tools/schemas/vibtools-docs.schema.json')."
    },
    "schemaVersion": {
      "const": 1,
      "default": 1,
      "description": "Schema format version marker. Must be 1 when specified."
    },
    "docsType": {
      "type": "string",
      "enum": [
        "users",
        "developer",
        "both"
      ],
      "default": "both",
      "description": "Target portal audience: 'users' (docs.vib.tools), 'developer' (developer.vibtools.io), or 'both' (serves both portals)."
    },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      "description": "Lowercase URL-safe product slug (e.g. 'licenx', 'socketcore'). Defaults to normalized repository name from repoUrl."
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "description": "Display title for the product card and navigation header. Falls back to root index.md frontmatter or first # H1 heading."
    },
    "category": {
      "type": "string",
      "minLength": 1,
      "description": "Hub filter category label (e.g. 'Desktop Apps', 'Core Engine', 'SDKs & Modules')."
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "description": "Concise 1-2 sentence product summary for Hub cards, SEO meta description, and llms.txt index."
    },
    "version": {
      "type": [
        "string",
        "number"
      ],
      "description": "Displayed release version badge (e.g. '1.2.0'). Leading 'v' is normalized automatically at render time."
    },
    "accentColor": {
      "type": "string",
      "pattern": "^#(?:[\\da-fA-F]{3}|[\\da-fA-F]{4}|[\\da-fA-F]{6}|[\\da-fA-F]{8})$",
      "description": "3, 4, 6, or 8 digit hexadecimal CSS accent color (e.g. '#7C3AED' or '#2563EB')."
    },
    "docsPath": {
      "type": "string",
      "minLength": 1,
      "default": "docs",
      "description": "Relative POSIX folder path inside the repository containing index.md or README.md (e.g. 'docs', 'docs/users', 'docs/dev'). No leading '/', '\\', '..', or '.'."
    },
    "logoPath": {
      "type": "string",
      "minLength": 1,
      "description": "Relative POSIX file path to a static SVG or PNG product logo under 2 MB (e.g. '.vibtools/logo.png' or '.vibtools/logo.svg')."
    },
    "branch": {
      "type": "string",
      "minLength": 1,
      "default": "main",
      "description": "Git branch to sparse-checkout for documentation (defaults to 'main')."
    },
    "ctaLabel": {
      "type": "string",
      "minLength": 1,
      "description": "Topbar external action button label (e.g. 'View repository', 'Get License'). Ignored unless ctaUrl is also set."
    },
    "ctaUrl": {
      "type": "string",
      "format": "uri",
      "pattern": "^https?://",
      "description": "External HTTP or HTTPS URL opened by the topbar CTA button."
    },
    "targets": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": false,
      "description": "Optional per-portal overrides allowing a single repository to serve different docsPath, slug, title, category, description, accentColor, logoPath, ctaUrl, or branch to docs.vib.tools ('users') and developer.vibtools.io ('developer').",
      "properties": {
        "users": {
          "$ref": "#/$defs/target"
        },
        "developer": {
          "$ref": "#/$defs/target"
        }
      }
    }
  },
  "$defs": {
    "target": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "slug": {
          "type": "string",
          "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          "description": "Lowercase URL-safe product slug (e.g. 'licenx', 'socketcore'). Defaults to normalized repository name from repoUrl."
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "description": "Display title for the product card and navigation header. Falls back to root index.md frontmatter or first # H1 heading."
        },
        "category": {
          "type": "string",
          "minLength": 1,
          "description": "Hub filter category label (e.g. 'Desktop Apps', 'Core Engine', 'SDKs & Modules')."
        },
        "description": {
          "type": "string",
          "minLength": 1,
          "description": "Concise 1-2 sentence product summary for Hub cards, SEO meta description, and llms.txt index."
        },
        "version": {
          "type": [
            "string",
            "number"
          ],
          "description": "Displayed release version badge (e.g. '1.2.0'). Leading 'v' is normalized automatically at render time."
        },
        "accentColor": {
          "type": "string",
          "pattern": "^#(?:[\\da-fA-F]{3}|[\\da-fA-F]{4}|[\\da-fA-F]{6}|[\\da-fA-F]{8})$",
          "description": "3, 4, 6, or 8 digit hexadecimal CSS accent color (e.g. '#7C3AED' or '#2563EB')."
        },
        "docsPath": {
          "type": "string",
          "minLength": 1,
          "default": "docs",
          "description": "Relative POSIX folder path inside the repository containing index.md or README.md (e.g. 'docs', 'docs/users', 'docs/dev'). No leading '/', '\\', '..', or '.'."
        },
        "logoPath": {
          "type": "string",
          "minLength": 1,
          "description": "Relative POSIX file path to a static SVG or PNG product logo under 2 MB (e.g. '.vibtools/logo.png' or '.vibtools/logo.svg')."
        },
        "branch": {
          "type": "string",
          "minLength": 1,
          "default": "main",
          "description": "Git branch to sparse-checkout for documentation (defaults to 'main')."
        },
        "ctaLabel": {
          "type": "string",
          "minLength": 1,
          "description": "Topbar external action button label (e.g. 'View repository', 'Get License'). Ignored unless ctaUrl is also set."
        },
        "ctaUrl": {
          "type": "string",
          "format": "uri",
          "pattern": "^https?://",
          "description": "External HTTP or HTTPS URL opened by the topbar CTA button."
        }
      }
    }
  }
}
```

---

## 4. Runtime Validation Constraints Beyond JSON Schema

In addition to the JSON Schema structure above, `parseVibtoolsRepoConfig()` and `scripts/sync-docs.mjs` enforce these frozen invariants:

1. **Single config file rule:** Exactly one of `.vibtools/docs.config.json` or `.vibtools/config.docs.json` may exist; having both fails the build.
2. **Path safety (`docsPath` and `logoPath`):** Must be non-empty relative POSIX strings with no leading `/`, no Windows drive prefix (`C:`), no `\`, and no `.` or `..` path traversal segments. Symlinks inside `.vibtools/`, `docsPath`, or `logoPath` are rejected.
3. **Branch safety (`branch`):** Must be non-empty and must not contain whitespace, `\`, or `..`.
4. **Logo binary/SVG compliance:** Copied logos must be `.png` (valid 8-byte PNG header) or static `.svg` (no `<script>`, no `on*=` attributes, no external `http(s)://`/`//`/`javascript:` `href`/`src`), and `<= 2 MB` (`2,097,152` bytes).
5. **Docs root requirement:** Every configured `docsPath` must contain a root `index.md`, `index.mdx`, `README.md`, or `README.mdx`. `MANIFEST.md` files and `draft: true` pages are excluded automatically; if `draft` frontmatter is present, it must be a strict YAML boolean.
6. **Zero embedded credentials:** Repository URLs must never include embedded HTTP basic-auth credentials.

---

## 5. Frozen Reference Templates

### A. Single-Audience Users Docs (`docs.vib.tools`)

```json
{
  "$schema": "https://docs.vib.tools/schemas/vibtools-docs.schema.json",
  "schemaVersion": 1,
  "docsType": "users",
  "slug": "product-slug",
  "title": "Product Name",
  "category": "Desktop Apps",
  "description": "Concise end-user summary of the product.",
  "version": "1.0.0",
  "accentColor": "#2563EB",
  "docsPath": "docs",
  "logoPath": ".vibtools/logo.png",
  "branch": "main",
  "ctaLabel": "Open Product",
  "ctaUrl": "https://vib.tools/product-slug"
}
```

### B. Single-Audience Developer Docs (`developer.vibtools.io`)

```json
{
  "$schema": "https://docs.vib.tools/schemas/vibtools-docs.schema.json",
  "schemaVersion": 1,
  "docsType": "developer",
  "slug": "product-slug",
  "title": "Product Name",
  "category": "Core Infrastructure",
  "description": "Concise developer summary of architecture, SDKs, and APIs.",
  "version": "1.0.0",
  "accentColor": "#0EA5E9",
  "docsPath": "docs",
  "logoPath": ".vibtools/logo.svg",
  "branch": "main",
  "ctaLabel": "GitHub",
  "ctaUrl": "https://github.com/vibtoolshq/ProductRepo"
}
```

### C. Dual-Portal Docs (`docs.vib.tools` + `developer.vibtools.io` from one repo)

```json
{
  "$schema": "https://docs.vib.tools/schemas/vibtools-docs.schema.json",
  "schemaVersion": 1,
  "docsType": "both",
  "slug": "product-slug",
  "title": "Product Name",
  "version": "1.0.0",
  "accentColor": "#2563EB",
  "logoPath": ".vibtools/logo.svg",
  "branch": "main",
  "ctaLabel": "GitHub",
  "ctaUrl": "https://github.com/vibtoolshq/ProductRepo",
  "targets": {
    "users": {
      "title": "Product Name User Documentation",
      "category": "Desktop Apps",
      "description": "End-user setup, guides, and troubleshooting.",
      "docsPath": "docs/users"
    },
    "developer": {
      "title": "Product Name Developer Documentation",
      "category": "Core Infrastructure",
      "description": "Architecture, APIs, database, and contributor reference.",
      "docsPath": "docs/dev"
    }
  }
}
```
