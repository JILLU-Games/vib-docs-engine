# Content Layer

`content.config.ts` defines the validated Astro `docs` collection. Synced Markdown/MDX is stored under `docs/` only during build/local sync and is generated from product repositories; do not author there. Relative assets are copied with their documentation tree. Sync owns cleanup and `.gitkeep` preservation.
