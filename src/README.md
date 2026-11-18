# Astro Source

This is the engine implementation. Portal data comes from `config/`, product content and `src/generated/manifest.json` are produced by sync, and Astro prerenders routes from the manifest plus Content Collection. Do not hardcode portal catalogs/categories or hand-edit generated folders.

Direct children are the content schema, components, generated data, layouts, pages, styles, and shared utilities. Generated content (`content/docs/`, `generated/`) deliberately has no README/MANIFEST because sync replaces it and it is not authored source. `pages/` and `pages/[product]/` are also README/MANIFEST exceptions because Astro treats Markdown documents there as publishable routes; their inventory is maintained here and in `project/04-codebase-reference.md`.
