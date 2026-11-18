# Development Notes

`notes/` is a development-time workspace for private planning, implementation checklists, investigation notes, and chronological update/fix logs. It is not application content, a product-docs source, or a public portal page.

## When to use it

Before starting any code, config, or documentation change, create or update a dated note here with the goal, inspected source files, exact plan, and verification criteria. During work, append the completed steps, decisions, test results, and any deferred item. Do not invent project facts: link each technical observation to a checked-in file or a test result.

## Boundaries

- Keep implementation plans and personal development notes here; keep durable architecture, code maps, feature specifications, and change history in `project/`.
- Keep operator and end-user instructions in `docs/`.
- Never import or publish files from `notes/` in Astro routes, generated manifests, presets, or deployment artifacts.
- `notes/` is excluded by the portal exporter and from runtime code.
