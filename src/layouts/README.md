# Layouts

Layouts provide the shared static page shells. `BaseLayout.astro` imports global styles, sets metadata/canonical/OpenGraph fields and route accent, initializes theme before paint, and mounts the single global SearchModal. `HubLayout.astro` adds the portal header/nav/footer. `DocsLayout.astro` composes the product topbar, sidebar, content-only Pagefind article, breadcrumbs, TOC, and pagination.
