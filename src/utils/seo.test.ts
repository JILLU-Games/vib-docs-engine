import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocBreadcrumbs,
  buildDocDocumentTitle,
  buildDocJsonLd,
  buildHubJsonLd,
  formatBaseTitle,
  resolveAbsoluteUrl,
  resolveOrigin,
  safeJsonLdStringify,
} from "./seo";
import type { SiteConfig } from "./manifest";

const sampleSite: SiteConfig = {
  portalTitle: "Vib Tools Documentation",
  portalSubtitle: "Guides and references for building with Vib Tools.",
  domain: "docs.vib.tools",
  brandName: "Vib Tools",
  brandLogo: "/logos/vib-tools.png",
  defaultAccent: "#7C3AED",
  navLinks: [
    { label: "Vib Tools", href: "https://vib.tools" },
    { label: "GitHub", href: "https://github.com/vibtools" },
  ],
};

test("resolveOrigin and resolveAbsoluteUrl add https scheme fallback safely", () => {
  assert.equal(resolveOrigin("docs.vib.tools/"), "https://docs.vib.tools");
  assert.equal(
    resolveAbsoluteUrl("/vib-docs-engine/deployment/", sampleSite.domain),
    "https://docs.vib.tools/vib-docs-engine/deployment/",
  );
});

test("safeJsonLdStringify escapes HTML script tags to prevent breakout", () => {
  const serialized = safeJsonLdStringify({ title: "</script><script>alert(1)</script>&" });
  assert.ok(!serialized.includes("</script>"));
  assert.ok(serialized.includes("\\u003c/script\\u003e"));
  assert.ok(serialized.includes("\\u0026"));
  assert.deepEqual(JSON.parse(serialized), {
    title: "</script><script>alert(1)</script>&",
  });
});

test("formatBaseTitle and buildDocDocumentTitle prevent SERP truncation and redundant Documentation suffixes", () => {
  assert.equal(
    formatBaseTitle("Vib Tools Documentation", sampleSite.portalTitle, sampleSite.brandName),
    "Vib Tools Documentation",
  );
  assert.equal(
    formatBaseTitle("Page Not Found", sampleSite.portalTitle, sampleSite.brandName),
    "Page Not Found | Vib Tools",
  );
  assert.equal(
    buildDocDocumentTitle("CalGrid — User Documentation", "CalGrid"),
    "CalGrid — User Documentation",
  );
  assert.equal(
    buildDocDocumentTitle(
      "User accounts, administrators, permissions and audit",
      "ReadBox User Documentation",
    ),
    "User accounts, administrators, permissions and audit — ReadBox",
  );
  assert.equal(
    buildDocDocumentTitle("Getting started with ReadBox", "ReadBox User Documentation"),
    "Getting started with ReadBox",
  );
});

test("buildDocBreadcrumbs links existing folder overviews and dedupes product root pages", () => {
  const product = {
    slug: "calgrid",
    title: "CalGrid",
    flatPages: [
      { title: "Overview", route: "/calgrid/", source: "index.md" },
      { title: "Feature Guides", route: "/calgrid/guides/", source: "guides/index.md" },
      { title: "Attachments", route: "/calgrid/guides/attachments/", source: "guides/attachments.md" },
    ],
  };

  const rootCrumbs = buildDocBreadcrumbs({
    product,
    pageSource: "index.md",
    pageTitle: "CalGrid — User Documentation",
    canonicalPath: "/calgrid/",
  });
  assert.deepEqual(rootCrumbs, [
    { name: "Docs", item: "/" },
    { name: "CalGrid", item: "/calgrid/" },
  ]);

  const folderIndexCrumbs = buildDocBreadcrumbs({
    product,
    pageSource: "guides/index.md",
    pageTitle: "Feature Guides",
    canonicalPath: "/calgrid/guides/",
  });
  assert.deepEqual(folderIndexCrumbs, [
    { name: "Docs", item: "/" },
    { name: "CalGrid", item: "/calgrid/" },
    { name: "Feature Guides", item: "/calgrid/guides/" },
  ]);

  const nestedCrumbs = buildDocBreadcrumbs({
    product,
    pageSource: "guides/attachments.md",
    pageTitle: "Drive Attachments",
    canonicalPath: "/calgrid/guides/attachments/",
  });
  assert.deepEqual(nestedCrumbs, [
    { name: "Docs", item: "/" },
    { name: "CalGrid", item: "/calgrid/" },
    { name: "Feature Guides", item: "/calgrid/guides/" },
    { name: "Drive Attachments", item: "/calgrid/guides/attachments/" },
  ]);

  const numberedFolderCrumbs = buildDocBreadcrumbs({
    product: {
      ...product,
      flatPages: [
        ...product.flatPages,
        { title: "Getting Started", route: "/calgrid/getting-started/", source: "01. Getting Started/index.md" },
      ],
    },
    pageSource: "01. Getting Started/setup.md",
    pageTitle: "Setup",
    canonicalPath: "/calgrid/getting-started/setup/",
  });
  assert.deepEqual(numberedFolderCrumbs[2], {
    name: "Getting Started",
    item: "/calgrid/getting-started/",
  });

  const missingFolderCrumbs = buildDocBreadcrumbs({
    product: { ...product, flatPages: [{ title: "Overview", route: "/calgrid/", source: "index.md" }] },
    pageSource: "02-hidden/nested.md",
    pageTitle: "Nested",
    canonicalPath: "/calgrid/hidden/nested/",
  });
  assert.deepEqual(missingFolderCrumbs[2], { name: "Hidden" });
});

test("buildHubJsonLd outputs Organization, WebSite SearchAction, and CollectionPage ItemList", () => {
  const schema = buildHubJsonLd(sampleSite, [
    {
      slug: "calgrid",
      title: "CalGrid",
      description: "Calendar dispatcher.",
      version: "1.0.2",
      category: "Desktop Apps",
      logoUrl: "/logos/calgrid.png",
    },
  ]);
  const graph = schema["@graph"] as Array<Record<string, unknown>>;
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(graph.length, 3);
  assert.equal(graph[0]["@type"], "Organization");
  assert.equal(graph[0].logo, "https://docs.vib.tools/logos/vib-tools.png");
  assert.equal(graph[1]["@type"], "WebSite");
  assert.equal(graph[1].inLanguage, "en");
  const action = graph[1].potentialAction as Record<string, unknown>;
  assert.equal(action["@type"], "SearchAction");
  assert.deepEqual(action.target, {
    "@type": "EntryPoint",
    urlTemplate: "https://docs.vib.tools/?q={search_term_string}",
  });
  assert.equal(graph[2]["@type"], "CollectionPage");
  const itemList = graph[2].mainEntity as Record<string, unknown>;
  assert.equal(itemList["@type"], "ItemList");
  assert.equal(itemList.numberOfItems, 1);
  const firstEntry = (itemList.itemListElement as Array<Record<string, unknown>>)[0];
  assert.deepEqual(firstEntry.item, {
    "@type": "SoftwareApplication",
    name: "CalGrid",
    url: "https://docs.vib.tools/calgrid/",
    description: "Calendar dispatcher.",
    image: "https://docs.vib.tools/logos/calgrid.png",
    applicationCategory: "Desktop Apps",
    softwareVersion: "1.0.2",
  });
});

test("buildDocJsonLd outputs enriched TechArticle and ordered BreadcrumbList nodes", () => {
  const schema = buildDocJsonLd({
    site: sampleSite,
    product: {
      slug: "vib-docs-engine",
      title: "Vib Docs Engine",
      description: "Static engine docs.",
      version: "0.1.0",
      category: "Developer Tools",
      logoUrl: "/logos/vib.png",
    },
    pageTitle: "Deployment",
    description: "Deploy to Cloudflare Pages.",
    canonicalPath: "/vib-docs-engine/deployment/",
    breadcrumbs: [
      { name: "Docs", item: "/" },
      { name: "Vib Docs Engine", item: "/vib-docs-engine/" },
      { name: "Deployment", item: "/vib-docs-engine/deployment/" },
    ],
  });

  const graph = schema["@graph"] as Array<Record<string, unknown>>;
  assert.equal(graph[0]["@type"], "TechArticle");
  assert.equal(graph[0].headline, "Deployment");
  assert.equal(graph[0].inLanguage, "en");
  assert.equal(graph[0].articleSection, "Developer Tools");
  assert.equal(graph[0].image, "https://docs.vib.tools/logos/vib.png");
  assert.deepEqual(graph[0].about, {
    "@type": "SoftwareApplication",
    name: "Vib Docs Engine",
    url: "https://docs.vib.tools/vib-docs-engine/",
    applicationCategory: "Developer Tools",
    softwareVersion: "0.1.0",
  });

  const breadcrumbs = graph[1];
  assert.equal(breadcrumbs["@type"], "BreadcrumbList");
  const items = breadcrumbs.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 3);
  assert.equal(items[0].position, 1);
  assert.equal(items[2].item, "https://docs.vib.tools/vib-docs-engine/deployment/");
});
