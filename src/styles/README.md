# Global Styles

`global.css` is imported by `BaseLayout.astro`. It owns Tailwind CSS v4 and typography-plugin imports, light/dark CSS tokens, Tailwind theme mappings, base typography/scrollbars, reduced-motion behavior, and `.docs-prose` Markdown/code styling. Keep theme tokens centralized and avoid component-specific global overrides unless shared behavior requires them.
