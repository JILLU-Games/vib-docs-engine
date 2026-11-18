# Shared Utilities

Pure shared logic and data contracts live here. `manifest.ts` defines product/site/sidebar types; `sidebar.ts` normalizes document routes, builds recursive sidebar and flat page order; `theme.ts` validates accent fallbacks and derives monograms. Keep filesystem access injected into the sidebar builder and keep product-specific values out of the utilities.
