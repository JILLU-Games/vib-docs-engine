import assert from "node:assert/strict";
import test from "node:test";
import type { CollectionEntry } from "astro:content";
import {
  buildProductLlmsText,
  buildRootLlmsText,
  buildSingleDocMarkdownText,
  routeToMarkdownPath,
} from "./llms";
import type { ManifestProject, SiteConfig } from "./manifest";

const sampleSite: SiteConfig = {
  portalTitle: "Vib Tools Documentation",
  portalSubtitle: "End-user guides, setup manuals, and product tutorials.",
  domain: "https://docs.vib.tools",
  brandName: "Vib Tools",
  brandLogo: "/vib-tools-logo.png",
  defaultAccent: "#7C3AED",
  portalType: "users",
  navLinks: [],
};

const sampleProject: ManifestProject = {
  slug: "readbox",
  category: "Email & Collaboration",
  accentColor: "#2563EB",
  title: "ReadBox User Documentation",
  description: "End-user guide for ReadBox webmail.",
  version: "0.1.0",
  logoUrl: "/logos/readbox.svg",
  sidebar: [],
  flatPages: [
    {
      title: "Overview",
      route: "/readbox/",
      source: "index.md",
    },
    {
      title: "Admin Accounts",
      route: "/readbox/features/admin-and-accounts/",
      source: "features/admin-and-accounts.md",
    },
  ],
};

function makeFakeEntry(id: string, body: string, description?: string): CollectionEntry<"docs"> {
  return {
    id,
    body,
    collection: "docs",
    data: {
      title: id,
      description,
      draft: false,
    },
  } as unknown as CollectionEntry<"docs">;
}

test("routeToMarkdownPath converts canonical product and subpage routes", () => {
  assert.equal(routeToMarkdownPath("/readbox/", "readbox"), "/readbox/index.md");
  assert.equal(
    routeToMarkdownPath("/readbox/features/admin-and-accounts/", "readbox"),
    "/readbox/features/admin-and-accounts.md",
  );
});

test("buildRootLlmsText includes schema URL, full AI index, and Markdown links", () => {
  const output = buildRootLlmsText({
    site: sampleSite,
    categories: ["Email & Collaboration"],
    projects: [sampleProject],
  });

  assert.match(output, /Portal Type: users/);
  assert.match(output, /Full AI Index: https:\/\/docs\.vib\.tools\/llms-full\.txt/);
  assert.match(
    output,
    /\.vibtools Config JSON Schema: https:\/\/docs\.vib\.tools\/schemas\/vibtools-docs\.schema\.json/,
  );
  assert.match(output, /\[AI index\]\(https:\/\/docs\.vib\.tools\/readbox\/llms\.txt\)/);
  assert.match(output, /\[Markdown\]\(https:\/\/docs\.vib\.tools\/readbox\/index\.md\)/);
});

test("buildProductLlmsText emits Markdown Entry, schema URL, stripped YAML, and empty fallback", async () => {
  const overviewEntry = makeFakeEntry(
    "readbox",
    "---\ntitle: Overview\n---\n\n# Welcome\n\nReadBox overview content.",
    "Overview summary.",
  );
  const emptyEntry = makeFakeEntry(
    "readbox/features/admin-and-accounts.md",
    "---\ntitle: Admin Accounts\n---\n",
    "Manage admin permissions.",
  );

  const output = await buildProductLlmsText(
    sampleProject,
    [
      { page: sampleProject.flatPages[0], entry: overviewEntry },
      { page: sampleProject.flatPages[1], entry: emptyEntry },
    ],
    sampleSite.domain,
  );

  assert.match(output, /Markdown Entry: https:\/\/docs\.vib\.tools\/readbox\/index\.md/);
  assert.match(
    output,
    /\.vibtools Config JSON Schema: https:\/\/docs\.vib\.tools\/schemas\/vibtools-docs\.schema\.json/,
  );
  assert.match(
    output,
    /\[Markdown\]\(https:\/\/docs\.vib\.tools\/readbox\/features\/admin-and-accounts\.md\)/,
  );
  assert.ok(!output.includes("title: Overview"));
  assert.match(output, /ReadBox overview content\./);
  assert.match(output, /# Admin Accounts\n\nManage admin permissions\./);
});

test("buildSingleDocMarkdownText strips frontmatter and prepends source comment", async () => {
  const entry = makeFakeEntry(
    "readbox/features/admin-and-accounts.md",
    "---\ntitle: Admin Accounts\ndescription: Admin guide\n---\n\nBody text here.",
    "Admin guide",
  );
  const output = await buildSingleDocMarkdownText({
    project: sampleProject,
    page: sampleProject.flatPages[1],
    entry,
    domain: sampleSite.domain,
  });

  assert.match(
    output,
    /^<!-- Source: https:\/\/docs\.vib\.tools\/readbox\/features\/admin-and-accounts\/ \| Product: ReadBox User Documentation -->/,
  );
  assert.ok(!output.includes("description: Admin guide"));
  assert.match(output, /# readbox\/features\/admin-and-accounts\.md/);
  assert.match(output, /Body text here\./);
});
