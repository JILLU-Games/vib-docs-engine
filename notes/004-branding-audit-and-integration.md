# Branding Asset Audit & Integration Plan (2026-11-18)

## Goal

1. Perform a forensic audit of all 17 files uploaded under `public/vib.tools.Branding/vib.tools.Branding/`.
2. Replace placeholder geometric SVG assets (`public/favicon.svg`, `public/logos/vib-tools.svg`) with the original Vib Tools logo, favicons, PWA webmanifest, and OpenGraph social card cleanly across layouts, configs, presets, build/export scripts, and documentation.

## Inspected Files

- `public/vib.tools.Branding/vib.tools.Branding/*` (17 files, 5.2 MB total)
- `public/favicon.svg`, `public/logos/vib-tools.svg`, `public/MANIFEST.md`, `public/README.md`
- `src/layouts/BaseLayout.astro`, `src/layouts/HubLayout.astro`
- `config/site.config.json`, `config/presets/user-portal/site.config.json`, `config/presets/dev-portal/site.config.json`
- `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, `.gitignore`

## Audit Findings

| File | Dimensions / Size | SHA-256 Prefix | Audit Finding | Action |
| --- | --- | --- | --- | --- |
| `favicon.ico` | 48x48, 32x32, 16x16 / 15 KB | `f74136e9` | Valid multi-size ICO | Install as `public/favicon.ico` |
| `favicon-96x96.png` | 96x96 RGBA / 4.3 KB | `428c88dd` | Crisp compact PNG favicon | Install as `public/favicon-96x96.png` |
| `apple-touch-icon.png` | 180x180 RGBA / 18 KB | `7ac9dcc3` | Valid iOS touch icon | Install as `public/apple-touch-icon.png` |
| `web-app-manifest-192x192.png` | 192x192 RGBA / 20 KB | `100475fd` | Valid PWA manifest icon | Install as `public/web-app-manifest-192x192.png` |
| `web-app-manifest-512x512.png` | 512x512 RGBA / 148 KB | `3ed53a7d` | Valid PWA manifest icon | Install as `public/web-app-manifest-512x512.png` |
| `site.webmanifest` | JSON / 452 B | `45cea787` | Broken template (`MyWebSite`, `/favicon/...` dead paths, `#ffffff`) | Fix names, colors, icon paths -> `public/site.webmanifest` |
| `og-default.png` | 1731x909 RGB / 1.3 MB | `e9269dbd` | Official Vib Tools OpenGraph social banner | Install as `public/og-default.png` & wire `og:image`/`twitter:image` |
| `vibtools-favicon.png` | 128x128 RGBA / 19 KB | `53ff1386` | Crisp 5x-Retina square icon mark for `24x24` UI slot | Install as `public/logos/vib-tools.png` |
| `vibtools-icon.png` | 520x520 RGBA / 161 KB | `3eff5287` | Exact SHA-256 duplicate of `icon-512.png` | Omit after extraction (bloated duplicate) |
| `icon-512.png` | 520x520 RGBA / 161 KB | `3eff5287` | Exact duplicate of `vibtools-icon.png` & misnamed size | Omit after extraction |
| `favicon.svg` | 520x520 XML+Base64 PNG / 214 KB | `f274dc80` | Not a true vector SVG; wraps 214 KB base64 PNG `<image>` | Omit; replace old placeholder `public/favicon.svg` with PNG/ICO icons |
| `favicon.png` | 65x65 RGBA / 5.0 KB | `3297a8e6` | Non-standard 65x65 size superseded by `96x96` & `128x128` | Omit after extraction |
| `vibtools-horizontal-dark.png` | 1050x315 RGBA / 87 KB | `72b92378` | Dark-theme horizontal wordmark (not needed when header renders HTML `brandName`) | Omit from runtime `dist/` to avoid bloat |
| `vibtools-horizontal-light.png` | 1050x315 RGBA / 90 KB | `1f56d7bf` | Light-theme horizontal wordmark | Omit from runtime `dist/` to avoid bloat |
| `vibtools-icon-light.png` | 1024x1024 RGBA / 1.4 MB | `7d7cef19` | Oversized 1.4 MB square white-bg icon | Omit from runtime `dist/` to avoid bloat |
| `Profile-Photo-Vib.Tools.png` | 1254x1254 RGB / 1.4 MB | `d67f1f1a` | Social avatar PNG (1.4 MB) | Omit from runtime `dist/` to avoid bloat |
| `Profile-Photo-Vib.Tools.svg` | 1254x1254 SVG / 372 KB | `161fb226` | Heavy auto-traced social avatar SVG | Omit from runtime `dist/` to avoid bloat |

## Implementation Steps

1. Copy verified runtime assets (`favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `og-default.png`) to `public/` and `vibtools-favicon.png` to `public/logos/vib-tools.png`.
2. Write clean `public/site.webmanifest` and remove placeholder `public/favicon.svg`, `public/logos/vib-tools.svg`, and unorganized `public/vib.tools.Branding/`.
3. Update `config/site.config.json`, presets, `.gitignore`, `scripts/sync-docs.mjs`, `scripts/export-portal.mjs`, `scripts/verify-build.mjs`, and `src/layouts/BaseLayout.astro`.
4. Update documentation (`public/MANIFEST.md`, `public/README.md`, `project/04-codebase-reference.md`, `project/CHANGELOG.md`, `notes/MANIFEST.md`).
5. Verify with `npm run verify`, `compile_applet`, `lint_applet`, `export-portal` smoke test, and headless Chromium dark/light screenshots.

## Results

- Implemented and verified on 2026-11-18:
  - `npm run verify`, `compile_applet`, and `lint_applet` passed cleanly (`0` errors, `0` broken links).
  - `export-portal` smoke test preserved `public/logos/vib-tools.png` and excluded `vib-tools.svg` placeholders.
  - Headless Chromium dark/light inspection verified `<img src="/logos/vib-tools.png">` renders at `128x128` natural dimensions (`24x24` header slot) and `/favicon.ico`, `/favicon-96x96.png`, `/apple-touch-icon.png`, `/site.webmanifest`, and `/og-default.png` resolve cleanly with zero console or page errors.
