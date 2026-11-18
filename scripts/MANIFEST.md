# Scripts Directory Manifest

| File                | Purpose                                            | Invocation                               |
| ------------------- | -------------------------------------------------- | ---------------------------------------- | ----------------- |
| `README.md`         | Script folder instructions                         | Read before operating scripts            |
| `MANIFEST.md`       | Script inventory                                   | Documentation                            |
| `add-project.mjs`   | Interactive validated project config writer        | `npm run add-project`                    |
| `export-portal.mjs` | Portal preset exporter                             | `npm run export-portal -- --portal <user | dev> --out <dir>` |
| `run-astro.mjs`     | Conditional Astro CLI runner (Node >=22.23.4 floor shim only on sandbox 22.22-22.23.3) | `npm run dev`, `npm run build`, `npm run preview` |
| `sync-docs.mjs`     | Git sparse/local docs sync and manifest generation | `npm run sync`, `predev`, `prebuild`     |
| `verify-build.mjs`  | Post-build route/asset/link verification           | `npm run verify`                         |
