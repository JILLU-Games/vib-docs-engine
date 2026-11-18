# 014 — Frozen Baseline (`2026-11-18`) & `.vibtools/` Architecture Forensic Audit

**Date:** `2026-11-18`
**Status:** Baseline Frozen — Planning Complete (No Implementation Edits Yet)
**Audience:** Human Operators & Coding Agents (English + Bangla)

---

## 1. Frozen Baseline Snapshot (`2026-11-18`)

This document freezes the exact verified state of `vib-docs-engine` immediately after completing **SEO-Phase 01–04** and the **Brand Logo, Product Icon & Favicon Visibility Fix**, prior to implementing the **`.vibtools/` All-in-One Compact Repo Configuration & Dual-Portal (`users` / `developer`) Sync System (`VT-Phase 01` – `VT-Phase 04`)**.

### Verified Baseline Checkpoints
| Area | Verified State | Evidence / Verification |
| :--- | :--- | :--- |
| **Core Engine & Sync** | Git sparse-checkout single-phase clone (`docsPath` only), local `vib-docs-engine` fallback, `MANIFEST.md`/`draft: true` strip, `README.md` normalization, `findLogo` inside `<docsRoot>` | `scripts/sync-docs.mjs`, `npm run verify` |
| **Search Engine & AI SEO (`SEO-Phase 01`–`04`)** | `404` `noindex`, `og:type="article"`, `Disallow: /pagefind/`, XSS-safe Schema.org JSON-LD (`src/utils/seo.ts`), `/llms-full.txt`, per-page `*.md`, `?q=` Pagefind deep-link, JSON-LD/`.md` build verifier | `npx --yes tsx --test src/utils/seo.test.ts src/utils/search.test.ts` (`8/8` pass) |
| **Brand Logo & Favicons** | Persistent `public/vib-tools-logo.png`, `docs/logo.png`, `favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-*.png`, `site.webmanifest` (`any` + `maskable`), `og-default.png` | `node scripts/verify-build.mjs` (`6` HTML files, `15` required assets, `0` broken links), Chromium dark/light verified |
| **UI & TypeScript** | Compact Hub Hero, 4-column Footer, balanced `h-14` Headers, 3-column Docs Reader, SearchModal, Cloudflare Pages Functions (`/api/health`, `/api/webhook`) | `compile_applet` + `tsc --noEmit` + `tsc -p functions/tsconfig.json --noEmit` pass |

> **Bangla Summary (বেসলাইন ফ্রিজ):** `2026-11-18` তারিখে অ্যাপের Cloudflare Pages, UI/UX, Brand Logo/Favicon এবং SEO/AI Search (`SEO-Phase 01`–`04`) ১০০% verified অবস্থায় ফ্রিজ করা হলো। এখন **`.vibtools/` (All-in-One In-Repo Config + Dual Portal `users`/`developer` + `repoUrl`-Only Sync)** ইমপ্লিমেন্ট করার আগে ফরেনসিক অডিট, স্কোপ লক এবং রোডম্যাপ তৈরি করা হলো।

---

## 2. Forensic Audit — Current Gaps Blocking `.vibtools/` Compact System

Inspected files: `config/site.config.json`, `config/projects.json`, `config/presets/user-portal/site.config.json`, `config/presets/user-portal/projects.json`, `config/presets/dev-portal/site.config.json`, `config/presets/dev-portal/projects.json`, `src/utils/manifest.ts`, `scripts/sync-docs.mjs`, `scripts/add-project.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, `docs/index.md`, `docs/adding-projects.md`, `docs/deployment.md`.

### Audit Summary Table

| Audit ID | Area | Severity | Exact File & Line Reference | Current Behavior (Verified Proof) | Required Outcome | Target Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`VT-AUDIT-01`** | Portal Identity (`portalType`) | High | `config/site.config.json:1-18`, `config/presets/*/site.config.json:1-18`, `src/utils/manifest.ts:48-56`, `scripts/sync-docs.mjs:33-57` | `siteConfigSchema` & `SiteConfig` have no `portalType` field; neither `docs.vib.tools` (`users`) nor `developer.vibtools.io` (`developer`) can filter repositories automatically | Add optional `portalType: z.enum(["users", "developer", "all"]).default("all")` across schema, types, `site.config.json`, and both presets | **VT-Phase 01** |
| **`VT-AUDIT-02`** | `projects.json` Repo-URL-Only Input | High | `config/projects.json:1-14`, `scripts/sync-docs.mjs:59-88, 576-584` | `projectSchema` requires `slug`, `category`, `accentColor`, and `repoUrl` on every object; bare repo URL strings (`"https://..."`) throw validation errors | Accept both `string` repo URLs and partial objects (`{ repoUrl, ...optionalOverrides }`) when `.vibtools/` supplies missing metadata, while keeping legacy full objects 100% valid | **VT-Phase 01** & **02** |
| **`VT-AUDIT-03`** | Two-Step Sparse Checkout & `.vibtools/` Discovery | High | `scripts/sync-docs.mjs:302-375, 457-542` | `runGitSparseClone()` requires `docsPath` upfront (`git sparse-checkout set <docsPath>`) and never reads `.vibtools/docs.config.json` (or `.vibtools/config.docs.json` alias) inside the repository | Clone `--sparse` checking out `.vibtools` first (`set .vibtools`), parse & Zod-validate `.vibtools/docs.config.json` (or `config.docs.json`), check `portalType` match (skip mismatch cleanly), then `git sparse-checkout add <docsPath>` + logo parent | **VT-Phase 02** |
| **`VT-AUDIT-04`** | `.vibtools/` Logo Path & Smart Markdown Fallback | Medium | `scripts/sync-docs.mjs:398-442, 498-515` | `findLogo()` only checks `<docsRoot>`, `<docsRoot>/assets`, `<docsRoot>/images`; `description` & `version` stay empty if missing from frontmatter & `projects.json` | Resolve `logoPath` from `.vibtools/docs.config.json` -> `.vibtools/logo.{svg,png}` -> `<docsPath>` candidates; fall back to clean H1 / first-paragraph description / `vX.Y.Z` extraction when omitted | **VT-Phase 01** & **02** |
| **`VT-AUDIT-05`** | CLI, Verifier & Engine Self-Config | Medium | `scripts/add-project.mjs:117-256`, `scripts/verify-build.mjs:124-247`, `scripts/export-portal.mjs:180-195` | `add-project.mjs` forces manual `slug`, `category`, `accentColor`, `docsPath` prompts; engine repo lacks its own `.vibtools/` descriptor; presets still store full legacy boilerplate | Support minimal `repoUrl`-first entries in `add-project.mjs`, add `.vibtools/docs.config.json` + `.vibtools/logo.png` to engine root, update verifier & presets cleanly | **VT-Phase 03** |
| **`VT-AUDIT-06`** | Official `Vib Docs Engine` Documentation | High | `docs/index.md`, `docs/adding-projects.md`, `docs/deployment.md`, `docs/MANIFEST.md` | Docs explain only legacy `config/projects.json` + YAML frontmatter; zero documentation or JSON schema reference exists for `.vibtools/docs.config.json` (`config.docs.json`), dual `users`/`developer` targets, or `repoUrl`-only onboarding | Add comprehensive `.vibtools/` Configuration & Schema Guide (`docs/vibtools-config.md`) and update `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`, and `docs/MANIFEST.md` | **VT-Phase 04** |

---

## 3. Verbatim Code Block Proof From Inspected Files

### Proof 1 — `scripts/sync-docs.mjs:33-65` (Missing `portalType` & Strict Mandatory `slug`/`category`/`accentColor`)
```js
const siteConfigSchema = z.object({
  portalTitle: z.string().trim().min(1),
  portalSubtitle: z.string(),
  domain: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "https:", "must use HTTPS"),
  brandName: z.string().trim().min(1),
  brandLogo: z.string().trim().min(1),
  defaultAccent: hexColorSchema,
  navLinks: z.array( ... ),
});

const projectSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase URL-safe slug"),
    category: z.string().trim().min(1),
    accentColor: hexColorSchema,
    repoUrl: z.string().optional(),
```
**Proof Impact:** Passing `"https://github.com/org/repo.git"` or `{ "repoUrl": "https://github.com/org/repo.git" }` in `config/projects.json` fails immediately at `scripts/sync-docs.mjs:577` before any repo is cloned.

### Proof 2 — `scripts/sync-docs.mjs:329-333` & `488-494` (Single-Shot Sparse Checkout Assumes Known `docsPath`)
```js
  execFileSync("git", ["sparse-checkout", "set", docsPath], {
    cwd: destination,
    stdio: "pipe",
    encoding: "utf8",
  });
```
```js
      const checkoutDirectory = path.join(temporaryDirectory, "checkout");
      await cloneAndCheckout(project, checkoutDirectory, token);
      sourceDirectory = path.join(checkoutDirectory, project.docsPath);
```
**Proof Impact:** `cloneAndCheckout()` immediately sets `sparse-checkout` to `project.docsPath` (`"docs"` by default), so `.vibtools/` at repo root is never checked out or read, and custom `docs/users` vs `docs/dev` paths inside `.vibtools/docs.config.json` cannot be discovered dynamically.

### Proof 3 — `scripts/sync-docs.mjs:403-411` (`findLogo` Ignores `.vibtools/` & Custom `logoPath`)
```js
async function findLogo(sourceDirectory, project) {
  const directories = [
    sourceDirectory,
    path.join(sourceDirectory, "assets"),
    path.join(sourceDirectory, "images"),
  ];
  const names = ["logo.svg", "logo.png", "icon.svg", "icon.png"];
```
**Proof Impact:** Any logo stored at `.vibtools/logo.svg`, `.vibtools/logo.png`, or a custom configured `logoPath` in `.vibtools/docs.config.json` is ignored during `syncProject()`.

### Proof 4 — `scripts/sync-docs.mjs:503-514` (Empty `description` & `version` Without Frontmatter or `projects.json`)
```js
    const title =
      metadataString(frontmatter.title, "title", project) ||
      project.title ||
      titleFromMarkdown(parsedIndex.content) ||
      formatSlug(project.slug);
    const description =
      metadataString(frontmatter.description, "description", project) ||
      project.description ||
      "";
    const version =
      metadataString(frontmatter.version, "version", project) ||
      (project.version === undefined ? "" : String(project.version));
```
**Proof Impact:** Standard `docs/index.md` files without YAML frontmatter (such as `# CalGrid — User Documentation` followed by an intro paragraph and `CalGrid v1.0.2`) produce `description: ""` and `version: ""` unless `.vibtools/docs.config.json` or Markdown smart extraction supplies them.

---

## 4. Exact Phase Scope Locks Overview

1. **VT-Phase 01 (`src/utils/vibtoolsConfig.ts` + `src/utils/vibtoolsConfig.test.ts` + `src/utils/manifest.ts` + `config/site.config.json` + `config/presets/*/site.config.json`):** Pure schema/validation/resolver + dual-target (`users`/`developer`) merge logic + Smart Markdown fallback + `portalType` config types. **Zero edits to Astro UI, CSS, `scripts/sync-docs.mjs`, or `docs/`.**
2. **VT-Phase 02 (`scripts/sync-docs.mjs` + `src/utils/vibtoolsConfig.ts` minor adjustment if needed):** Two-step sparse checkout (`.vibtools` first -> target `docsPath` + `logoPath`), `docs.config.json` & `config.docs.json` auto-load, `portalType` filtering, custom `logoPath` & `.vibtools/logo.{svg,png}` discovery, and Smart Markdown fallback wiring. **Zero edits to Astro pages/layouts/components/CSS.**
3. **VT-Phase 03 (`.vibtools/docs.config.json`, `.vibtools/logo.png`, `scripts/add-project.mjs`, `scripts/verify-build.mjs`, `config/presets/*/projects.json`):** Repo-URL-only CLI support (`add-project.mjs`), self-repo `.vibtools/` example config, preset updates, and build verifier checks. **Zero edits to Astro UI/components.**
4. **VT-Phase 04 (`docs/vibtools-config.md` *(new)*, `docs/adding-projects.md`, `docs/index.md`, `docs/deployment.md`, `docs/MANIFEST.md`, `root MANIFEST.md`, `src/MANIFEST.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`):** Complete user/operator documentation for `.vibtools/docs.config.json` & `config.docs.json` with full JSON Schema, field rules, single/dual-target examples, and codebase doc sync.

> **Bangla Summary (ফরেনসিক অডিট):** `scripts/sync-docs.mjs`, `config/*`, `scripts/add-project.mjs`, এবং `docs/` পরীক্ষা করে **৬টি নির্দিষ্ট অডিট গ্যাপ (`VT-AUDIT-01` – `VT-AUDIT-06`)** এবং exact line-by-line code proof নোট করা হলো। প্রতিটি ফেজের ফাইল কঠোরভাবে **Scope Locked** রাখা হয়েছে যেন কোনো UI বা SEO ফিচারে সাইড-ইফেক্ট না পড়ে।
