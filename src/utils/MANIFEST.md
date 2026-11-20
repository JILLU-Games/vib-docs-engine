# Utilities Directory Manifest

| File          | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `README.md`   | Shared utility boundaries                        |
| `MANIFEST.md` | File inventory                                   |
| `manifest.ts`         | Site, project, sidebar, and flat-page contracts                         |
| `sidebar.ts`          | Recursive filesystem-to-route navigation builder                        |
| `search.ts`           | Search route normalization, breadcrumbs, recent docs, and suggestions   |
| `search.test.ts`      | `node:test` unit tests for pure search UI helpers                       |
| `seo.ts`              | Protocol-safe origins and XSS-safe Schema.org JSON-LD builders          |
| `seo.test.ts`         | `node:test` unit tests for JSON-LD and origin resolution                |
| `llms.ts`             | Shared YAML-free Markdown export and `/llms.txt` / `/llms-full.txt` builders |
| `llms.test.ts`        | `node:test` unit tests for AI index (`llms.txt`) and YAML-free Markdown builders |
| `vibtoolsConfig.ts`   | Zero-dependency `.vibtools/` config validator, dual-target resolver, and Markdown metadata extractor |
| `vibtoolsConfig.test.ts` | `node:test` unit tests for `.vibtools/` schema, filtering, and Smart Markdown parsing |
| `syncMetadata.ts`     | Pure zero-dependency sync display metadata precedence and cycle-safe sparse-branch switch helpers |
| `syncMetadata.test.ts` | `node:test` unit tests for `.vibtools/` precedence and sparse-branch switching guards |
| `theme.ts`            | Accent validation/fallback, monogram helpers, and URL query theme resolution/sync |
| `theme.test.ts`       | `node:test` unit tests for URL query theme resolution (`?theme=`/`?themes=`) and URL sync |
