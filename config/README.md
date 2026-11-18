# Configuration

`site.config.json` defines the active portal identity and `projects.json` defines its product catalog. The two tracked subdirectories under `presets/` are paired starting points for the separate user and developer portal repositories. Category filters are derived from project records, never from a hard-coded list.

`projects.json` requires a unique slug, category, accent color, and remote or temporary in-repository `localPath`. Branch defaults to `main`, docs path to `docs`, and CTA metadata is optional. Do not commit credentials or production local paths.
