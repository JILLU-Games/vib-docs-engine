import type { APIRoute } from "astro";
import manifest from "../generated/manifest.json";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines = [
    `# ${manifest.site.portalTitle}`,
    "",
    `> ${manifest.site.portalSubtitle}`,
    "",
    `Domain: ${manifest.site.domain}`,
    "",
    "This portal contains static product documentation. Product documentation is maintained in each product repository.",
  ];

  for (const category of manifest.categories) {
    const projects = manifest.projects.filter(
      (project) => project.category === category,
    );
    if (projects.length === 0) continue;
    lines.push("", `## ${category}`, "");
    for (const project of projects) {
      const version = project.version ? ` (v${project.version})` : "";
      const docsUrl = new URL(
        `/${encodeURIComponent(project.slug)}/`,
        manifest.site.domain,
      ).href;
      const llmsUrl = new URL(
        `/${encodeURIComponent(project.slug)}/llms.txt`,
        manifest.site.domain,
      ).href;
      lines.push(
        `- [${project.title}${version}](${docsUrl}) - ${project.description || "Product documentation."} [AI index](${llmsUrl})`,
      );
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
