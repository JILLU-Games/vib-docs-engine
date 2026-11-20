import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import manifest from "../../generated/manifest.json";
import { buildProductLlmsText, resolveProductEntries } from "../../utils/llms";
import type { ManifestProject } from "../../utils/manifest";

interface Props {
  project: ManifestProject;
}

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () =>
  manifest.projects.map((project) => ({
    params: { product: project.slug },
    props: { project: project as unknown as ManifestProject },
  }));

export const GET: APIRoute = async (context) => {
  const { project } = context.props as Props;
  const entries = await getCollection("docs");
  const pageEntries = resolveProductEntries(project, entries);
  const body = await buildProductLlmsText(
    project,
    pageEntries,
    manifest.site.domain,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
