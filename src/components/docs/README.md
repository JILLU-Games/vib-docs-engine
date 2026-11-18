# Documentation Reader Components

These components render product navigation and article chrome from `ManifestProject`, `FlatPage`, and Astro heading props. `Topbar` owns the switcher/search/CTA/mobile-menu trigger; `Sidebar` composes recursive `SidebarTree`; `TableOfContents` observes heading intersections; `PrevNextNav` follows manifest order and constructs repository edit links. Keep article-only Pagefind attributes on the article in `DocsLayout`, not on these controls.
