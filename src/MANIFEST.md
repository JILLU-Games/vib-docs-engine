# Source Directory Manifest

| File/folder         | Purpose                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `README.md`         | Source ownership and editing rules                                                                        |
| `MANIFEST.md`       | Direct source inventory                                                                                   |
| `content.config.ts` | Astro docs collection loader and schema                                                                   |
| `components/`       | Hub, docs, UI, and MDX components                                                                         |
| `content/`          | Content Collection root; synced docs are generated                                                        |
| `generated/`        | Sync-generated manifest; do not hand-edit                                                                 |
| `layouts/`          | Base, Hub, and docs page shells                                                                           |
| `pages/`            | Static HTML routes, AI text/Markdown endpoints (`llms.txt`, `llms-full.txt`, `*.md`), and `robots.txt`; no local Markdown indexes because Astro treats Markdown there as routes |
| `styles/`           | Tailwind/global design tokens and prose rules                                                             |
| `utils/`            | Manifest contracts, theme helpers, sidebar builder, search helpers, SEO JSON-LD, and AI LLMs utilities    |
