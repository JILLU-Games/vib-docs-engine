import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBalancedStartLinks,
  buildQuickSuggestions,
  formatBreadcrumb,
  normalizeRoutePath,
  selectInitialSuggestions,
  upsertRecentDoc,
  type SearchLinkEntry,
} from "./search";
import type { ManifestProject } from "./manifest";

test("normalizeRoutePath ensures canonical trailing slash", () => {
  assert.equal(normalizeRoutePath("/vib-docs-engine/deployment"), "/vib-docs-engine/deployment/");
  assert.equal(normalizeRoutePath("https://docs.vib.tools/vib-docs-engine"), "/vib-docs-engine/");
  assert.equal(normalizeRoutePath("/"), "/");
});

test("formatBreadcrumb creates readable hierarchy labels", () => {
  assert.equal(
    formatBreadcrumb("/vib-docs-engine/adding-projects/", "Vib Docs Engine"),
    "Vib Docs Engine › Adding Projects",
  );
  assert.equal(
    formatBreadcrumb("/vib-docs-engine/", "Vib Docs Engine"),
    "Vib Docs Engine › Overview",
  );
});

test("upsertRecentDoc deduplicates by route and respects limit", () => {
  const base: SearchLinkEntry[] = [
    {
      title: "Deployment",
      route: "/vib-docs-engine/deployment/",
      productSlug: "vib-docs-engine",
      productTitle: "Vib Docs Engine",
      breadcrumb: "Vib Docs Engine › Deployment",
    },
    {
      title: "Adding Projects",
      route: "/vib-docs-engine/adding-projects/",
      productSlug: "vib-docs-engine",
      productTitle: "Vib Docs Engine",
      breadcrumb: "Vib Docs Engine › Adding Projects",
    },
  ];
  const updated = upsertRecentDoc(
    base,
    {
      title: "Adding Projects",
      route: "/vib-docs-engine/adding-projects",
      productSlug: "vib-docs-engine",
      productTitle: "Vib Docs Engine",
      breadcrumb: "",
    },
    2,
  );
  assert.equal(updated.length, 2);
  assert.equal(updated[0]?.route, "/vib-docs-engine/adding-projects/");
  assert.equal(updated[1]?.route, "/vib-docs-engine/deployment/");
});

test("buildQuickSuggestions and selectInitialSuggestions exclude recent duplicates and honor scope", () => {
  const projects: ManifestProject[] = [
    {
      slug: "vib-docs-engine",
      category: "Core Engine",
      accentColor: "#7C3AED",
      title: "Vib Docs Engine",
      description: "Engine",
      logoUrl: null,
      sidebar: [],
      flatPages: [
        { title: "Overview", route: "/vib-docs-engine/", source: "index.md" },
        { title: "Adding Projects", route: "/vib-docs-engine/adding-projects/", source: "adding-projects.md" },
        { title: "Deployment", route: "/vib-docs-engine/deployment/", source: "deployment.md" },
      ],
    },
  ];

  const suggestions = buildQuickSuggestions(projects, 4);
  assert.equal(suggestions[0]?.route, "/vib-docs-engine/adding-projects/");

  const selected = selectInitialSuggestions({
    suggestions,
    recentDocs: [suggestions[0]!],
    scope: "product",
    scopeSlug: "vib-docs-engine",
    limit: 4,
  });
  assert.equal(selected.recent.length, 1);
  assert.equal(selected.suggested.some((item) => item.route === suggestions[0]?.route), false);
});

test("buildBalancedStartLinks prioritizes onboarding guides in round-robin across products", () => {
  const projects: ManifestProject[] = [
    {
      slug: "calgrid",
      category: "Desktop Apps",
      accentColor: "#4F46E5",
      title: "CalGrid",
      description: "Scheduler",
      logoUrl: null,
      sidebar: [],
      flatPages: [
        { title: "Overview", route: "/calgrid/", source: "index.md" },
        { title: "Brand Identity", route: "/calgrid/guides/brand/", source: "guides/brand.md" },
        { title: "Getting Started", route: "/calgrid/getting-started/", source: "getting-started/index.md" },
      ],
    },
    {
      slug: "readbox",
      category: "Email",
      accentColor: "#2457C5",
      title: "ReadBox User Documentation",
      description: "Inbound mail",
      logoUrl: null,
      sidebar: [],
      flatPages: [
        { title: "Overview", route: "/readbox/", source: "index.md" },
        { title: "Domains and DNS", route: "/readbox/features/domains/", source: "features/domains.md" },
        { title: "Getting started with ReadBox", route: "/readbox/getting-started/", source: "getting-started.md" },
      ],
    },
  ];

  const links = buildBalancedStartLinks(projects, 2);
  assert.equal(links.length, 2);
  assert.equal(links[0]?.route, "/calgrid/getting-started/");
  assert.equal(links[1]?.route, "/readbox/getting-started/");
});
