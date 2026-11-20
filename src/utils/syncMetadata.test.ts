import assert from "node:assert/strict";
import test from "node:test";
import {
  nextSparseBranchTarget,
  resolveProjectDisplayMetadata,
} from "./syncMetadata";

test("resolveProjectDisplayMetadata prioritizes .vibtools/project config over stale index.md frontmatter", () => {
  const resolved = resolveProjectDisplayMetadata({
    projectTitle: "CalGrid",
    projectDescription:
      "High-deliverability Windows desktop scheduler and batch dispatcher for Google Calendar invitations with anti-spam safeguards.",
    projectVersion: "1.0.4",
    frontmatterTitle: "CalGrid — User Documentation",
    frontmatterDescription: "Old description in index.md frontmatter",
    frontmatterVersion: "1.0.2",
    extractedTitle: "CalGrid",
    extractedDescription: "Extracted summary",
    extractedVersion: "1.0.1",
    markdownHeadingTitle: "CalGrid",
    fallbackSlugTitle: "Calgrid",
  });

  assert.equal(resolved.title, "CalGrid");
  assert.equal(
    resolved.description,
    "High-deliverability Windows desktop scheduler and batch dispatcher for Google Calendar invitations with anti-spam safeguards.",
  );
  assert.equal(resolved.version, "1.0.4");
});

test("resolveProjectDisplayMetadata falls back to frontmatter, extracted markdown, heading, and slug", () => {
  const fromFrontmatter = resolveProjectDisplayMetadata({
    frontmatterTitle: "ReadBox User Documentation",
    frontmatterDescription: "Frontmatter summary.",
    frontmatterVersion: "0.2.0",
    extractedTitle: "Extracted Title",
    extractedDescription: "Extracted summary.",
    extractedVersion: "0.1.0",
    fallbackSlugTitle: "Readbox",
  });
  assert.deepEqual(fromFrontmatter, {
    title: "ReadBox User Documentation",
    description: "Frontmatter summary.",
    version: "0.2.0",
  });

  const fromFallback = resolveProjectDisplayMetadata({
    projectVersion: 0,
    extractedDescription: "Extracted paragraph.",
    markdownHeadingTitle: "Heading Title",
    fallbackSlugTitle: "Fallback Slug",
  });
  assert.deepEqual(fromFallback, {
    title: "Heading Title",
    description: "Extracted paragraph.",
    version: "0",
  });
});

test("nextSparseBranchTarget prevents cycles, no-ops, and runaway branch redirects", () => {
  const visited = new Set(["main"]);

  assert.equal(nextSparseBranchTarget("main", "main", visited), null);
  assert.equal(nextSparseBranchTarget("main", "", visited), null);
  assert.equal(nextSparseBranchTarget("main", "docs-v2", visited), "docs-v2");

  visited.add("docs-v2");
  assert.equal(nextSparseBranchTarget("docs-v2", "main", visited), null);
  assert.equal(nextSparseBranchTarget("docs-v2", "docs-v3", visited), "docs-v3");

  visited.add("docs-v3");
  assert.equal(nextSparseBranchTarget("docs-v3", "docs-v4", visited), null);
});
