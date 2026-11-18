# 011 — Error Handling Inventory & Planned Hardening

**Date:** `2026-11-18`
**Scope:** Complete inventory of existing production error handling + planned error handling additions for `SEO-Phase 01`–`04` and future operations.

---

## 1. Existing Error Handling (Verified Active in Codebase)

| Layer | File | Implemented Safeguard | Behavior on Failure |
| :--- | :--- | :--- | :--- |
| **Config & Sync** | `scripts/sync-docs.mjs` | Zod schema validation (`siteSchema`, `projectsSchema`), `assertWithin` path containment, symlink rejection, `draft` boolean frontmatter validation, `sanitizeError` token redaction, per-project error isolation | Fails fast with redacted error (secrets/URLs never printed); `vib-docs-engine` / `YOUR_ORG` safely falls back to local `./docs` in dev |
| **CLI Registry** | `scripts/add-project.mjs` | Duplicate slug check, `validateRemote` (rejects embedded credentials), `validateDocsPath` (blocks `..` traversal), paired CTA validation, atomic temp-file JSON rename | Rejects bad input inline; preserves original `config/projects.json` on failure |
| **Portal Exporter** | `scripts/export-portal.mjs` | `isWithin` recursive output guard, existing directory overwrite refusal, atomic staging rename | Refuses unsafe output paths before copying files |
| **Build & Routes** | `src/pages/[product]/[...slug].astro` | Manifest-to-collection parity check (`productEntries` & `flatPages` existence checks) | Fails static build loudly instead of shipping silent missing doc routes |
| **Build Verifier** | `scripts/verify-build.mjs` | Checks 14 required assets, webmanifest icon paths, Cloudflare `wrangler.toml`/Functions files, `_routes.json` schema, invalid custom-domain `_redirects`, every `flatPages` HTML file, every internal `href` & `img[src]` | Exits with code `1` listing exact missing/broken paths |
| **Search UI Runtime** | `src/components/ui/SearchModal.astro` | `safeResultUrl` same-origin enforcement, DOM construction with `textContent` (no raw HTML injection except trusted `<mark>` splitting), `localStorage` `try/catch`, Pagefind load failure message | Shows clean inline error `"Search index failed to load. Run npm run build first."`; never crashes or leaks XSS |
| **Edge Functions** | `functions/api/health.ts`, `functions/api/webhook.ts` | `405` non-GET/POST rejection, timing-safe Web Crypto `HMAC-SHA256` / bearer verification, `ALLOWED_BRANCHES` skip (`200`), upstream HTTP `502` relay guard, missing hook env `500` guard | Returns clean structured JSON errors without exposing secrets |
| **URL & Theme Guards** | `src/utils/theme.ts`, `src/layouts/HubLayout.astro`, `src/layouts/BaseLayout.astro` | Safe `resolveAccentColor` hex fallback, safe `new URL(site.domain)` host parsing catch, safe `localStorage` inline theme boot | Falls back cleanly to default accent (`#7C3AED` / `#2563eb`), stripped host string, and `"dark"` theme |

---

## 2. Missing / Planned Error Handling to Add (SEO & AI Search Phases)

| Guard ID | Target Module | Risk If Unhandled | Planned Safe Handling | Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| **`EH-SEO-01`** | `src/utils/seo.ts` (`safeJsonLdStringify`) | A doc title or description containing `</script>`, `<`, or `&` inside JSON-LD breaks out of `<script type="application/ld+json">` and corrupts page HTML / creates XSS | Escape `<` (`\u003c`), `>` (`\u003e`), `&` (`\u0026`), `\u2028`, `\u2029` cleanly in JSON serializer | **SEO-Phase 02** |
| **`EH-SEO-02`** | `src/utils/seo.ts` & `src/layouts/BaseLayout.astro` (`resolveCanonicalUrl`) | Misconfigured `site.domain` without protocol (`docs.vib.tools`) causes `new URL(...)` to throw during build | Validate and normalize protocol fallback safely with clear actionable build message if invalid | **SEO-Phase 01 / 02** |
| **`EH-SEO-03`** | `src/utils/llms.ts` & `src/pages/[product]/[...slug].md.ts` | Missing `entry.filePath`, unreadable disk file, or empty markdown frontmatter-only page crashes `llms-full.txt` or `.md` route generation | Gracefully fall back to `entry.body || ""`, normalize empty body to title/description summary, and throw explicit route-level error only on missing manifest parity | **SEO-Phase 03** |
| **`EH-SEO-04`** | `src/components/ui/SearchModal.astro` (`?q=` handler) | Overlong or malformed `?q=` query string triggers broken Pagefind searches or `replaceState` errors inside sandboxed iframes | Trim and cap `?q=` to `120` chars, handle zero-result states gracefully, wrap `window.history.replaceState` in `try/catch` | **SEO-Phase 04** |
| **`EH-SEO-05`** | `scripts/verify-build.mjs` (JSON-LD & `.md` verifier) | Invalid JSON-LD syntax or missing `/llms-full.txt` / per-page `.md` silently reaches Cloudflare production | Extract and `JSON.parse` every `<script type="application/ld+json">` in built HTML; fail build with exact file path if malformed or if `.md` / `llms-full.txt` / `404 noindex` is missing | **SEO-Phase 04** |

---

## 3. Future Optional Error Handling (Post-SEO Backlog)
- **External Repo Sync Retry Backoff (`scripts/sync-docs.mjs`):** Retry transient `git clone` network blips once before failing CI builds.
- **Image Asset Size Budget Warning (`scripts/verify-build.mjs`):** Emit a warning if unoptimized doc images exceed `1 MB` in `dist/` to protect Core Web Vitals (LCP).

> **Bangla Summary (এরর হ্যান্ডলিং ডকুমেন্ট):** বর্তমানে প্রজেক্টে Sync, CLI, Exporter, Pagefind Search এবং Cloudflare Functions-এ কী কী error handling চালু আছে তা লিপিবদ্ধ করা হয়েছে। এর পাশাপাশি নতুন SEO ও AI Search আপডেটের সময় JSON-LD XSS escaping (`</script>` সুরক্ষা), `.md` ফাইল মিসিং গার্ড, safe `?q=` হ্যান্ডলিং, এবং build-time JSON-LD validation যুক্ত করার প্ল্যান নোট করা হলো।
