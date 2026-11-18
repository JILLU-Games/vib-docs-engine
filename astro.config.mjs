import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import astroExpressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { unified } from "@astrojs/markdown-remark";

const siteConfigPath = new URL("./config/site.config.json", import.meta.url);
const siteConfig = JSON.parse(readFileSync(siteConfigPath, "utf8"));

function externalMarkdownLinks() {
  return (tree) => {
    function visit(node) {
      if (node.type === "link" && /^https?:\/\//i.test(node.url || "")) {
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        };
      }
      for (const child of node.children || []) visit(child);
    }

    visit(tree);
  };
}

export default defineConfig({
  site: siteConfig.domain,
  output: "static",
  trailingSlash: "ignore",
  integrations: [
    astroExpressiveCode({
      themes: ["github-dark", "github-light"],
    }),
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({ remarkPlugins: [externalMarkdownLinks] }),
  },
});
