# UI Components

Shared interactive UI used by the static layouts. `ThemeToggle.astro` changes the root theme class and stores the preference locally. `SearchModal.astro` loads Pagefind only on first open, accepts the `vib:open-search` event, scopes by the docs product filter, and supports global search. Preserve no-index development fallback and accessible focus/close behavior.
