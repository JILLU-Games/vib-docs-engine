import type { FlatPage, ManifestProject, SiteConfig } from "./manifest";

export interface BreadcrumbCrumb {
  name: string;
  item?: string;
}

export interface DocJsonLdInput {
  site: Pick<SiteConfig, "domain" | "brandName" | "brandLogo" | "portalTitle" | "portalSubtitle">;
  product: {
    slug: string;
    title: string;
    description?: string;
    version?: string | number;
    category?: string;
    logoUrl?: string | null;
  };
  pageTitle: string;
  description?: string;
  canonicalPath: string;
  breadcrumbs: BreadcrumbCrumb[];
}

export function resolveOrigin(domain: string): string {
  const trimmed = (domain || "https://docs.vib.tools").trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return withScheme.replace(/\/+$/, "");
  }
}

export function resolveAbsoluteUrl(pathOrUrl: string, domain: string): string {
  const origin = resolveOrigin(domain);
  try {
    return new URL(pathOrUrl, `${origin}/`).href;
  } catch {
    return `${origin}/${String(pathOrUrl || "").replace(/^\/+/, "")}`;
  }
}

export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function normalizeProductSeoLabel(productTitle: string): string {
  const trimmed = productTitle.trim();
  if (!trimmed) return "Docs";
  const stripped = trimmed
    .replace(/\s+(?:(?:user|developer)\s+)?documentation$/i, "")
    .replace(/\s+docs$/i, "")
    .trim();
  return stripped || trimmed;
}

export function buildDocDocumentTitle(pageTitle: string, productTitle: string): string {
  const cleanPage = pageTitle.trim();
  const compactProduct = normalizeProductSeoLabel(productTitle);
  if (!cleanPage) return compactProduct;
  if (
    cleanPage.toLowerCase() === productTitle.trim().toLowerCase() ||
    cleanPage.toLowerCase().includes(compactProduct.toLowerCase())
  ) {
    return cleanPage;
  }
  return `${cleanPage} — ${compactProduct}`;
}

export function formatBaseTitle(
  title: string,
  portalTitle: string,
  brandName: string,
): string {
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle === portalTitle) {
    return portalTitle;
  }
  const suffix = (brandName || portalTitle).trim();
  return `${cleanTitle} | ${suffix}`;
}

function normalizeSeoRoute(route: string): string {
  const ensured = route.startsWith("/") ? route : `/${route}`;
  return ensured.endsWith("/") ? ensured : `${ensured}/`;
}

function humanizeSegment(segment: string): string {
  return segment
    .replace(/^\d+[-_.\s]+/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function cleanSeoRouteSegment(segment: string): string {
  const stripped = segment.replace(/^\d+[-_.\s]+/, "");
  const normalized = stripped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || segment.toLowerCase();
}

export function buildDocBreadcrumbs(params: {
  product: Pick<ManifestProject, "slug" | "title" | "flatPages">;
  pageSource: string;
  pageTitle: string;
  canonicalPath: string;
}): BreadcrumbCrumb[] {
  const { product, pageSource, pageTitle, canonicalPath } = params;
  const productRootRoute = normalizeSeoRoute(`/${encodeURIComponent(product.slug)}/`);
  const normalizedCanonical = normalizeSeoRoute(canonicalPath);

  const crumbs: BreadcrumbCrumb[] = [
    { name: "Docs", item: "/" },
    { name: product.title, item: productRootRoute },
  ];

  if (normalizedCanonical === productRootRoute) {
    return crumbs;
  }

  const routeByPath = new Map<string, FlatPage>();
  for (const candidate of product.flatPages ?? []) {
    if (candidate?.route) {
      routeByPath.set(normalizeSeoRoute(candidate.route), candidate);
    }
  }

  const rawDirs = pageSource
    .replace(/\\/g, "/")
    .split("/")
    .slice(0, -1)
    .filter(Boolean);

  const accumulatedDirs: string[] = [];
  for (const rawDir of rawDirs) {
    accumulatedDirs.push(rawDir);
    const cleanedDirs = accumulatedDirs
      .map(cleanSeoRouteSegment)
      .filter(Boolean);
    const candidateRoute = normalizeSeoRoute(
      `/${encodeURIComponent(product.slug)}/${cleanedDirs.join("/")}/`,
    );

    if (candidateRoute === normalizedCanonical) {
      continue;
    }

    const folderPage = routeByPath.get(candidateRoute);
    crumbs.push({
      name: folderPage?.title || humanizeSegment(rawDir),
      ...(folderPage ? { item: folderPage.route } : {}),
    });
  }

  crumbs.push({ name: pageTitle, item: normalizedCanonical });
  return crumbs;
}

export function buildHubJsonLd(
  site: SiteConfig,
  projects: Array<
    Pick<
      ManifestProject,
      "slug" | "title" | "description" | "version" | "category" | "logoUrl"
    >
  > = [],
): Record<string, unknown> {
  const origin = resolveOrigin(site.domain);
  const sameAs = (site.navLinks ?? [])
    .map((link) => link?.href?.trim())
    .filter((href): href is string => Boolean(href && /^https?:\/\//i.test(href)));

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: site.brandName,
    url: `${origin}/`,
    description: site.portalSubtitle,
  };

  if (site.brandLogo) {
    organization.logo = resolveAbsoluteUrl(site.brandLogo, origin);
  }
  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: `${origin}/`,
    name: site.portalTitle,
    description: site.portalSubtitle,
    inLanguage: "en",
    publisher: { "@id": `${origin}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const collectionPage: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": `${origin}/#collection`,
    url: `${origin}/`,
    name: site.portalTitle,
    description: site.portalSubtitle,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#organization` },
  };

  if (projects.length > 0) {
    collectionPage.mainEntity = {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => {
        const app: Record<string, unknown> = {
          "@type": "SoftwareApplication",
          name: project.title,
          url: resolveAbsoluteUrl(`/${encodeURIComponent(project.slug)}/`, origin),
          description: project.description?.trim() || site.portalSubtitle,
          image: resolveAbsoluteUrl(
            project.logoUrl || site.brandLogo || "/og-default.png",
            origin,
          ),
        };
        if (project.category?.trim()) {
          app.applicationCategory = project.category.trim();
        }
        const versionText =
          project.version === undefined ? "" : String(project.version).trim();
        if (versionText) {
          app.softwareVersion = versionText;
        }
        return {
          "@type": "ListItem",
          position: index + 1,
          item: app,
        };
      }),
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, collectionPage],
  };
}

export function buildDocJsonLd(input: DocJsonLdInput): Record<string, unknown> {
  const { site, product, pageTitle, description, canonicalPath, breadcrumbs } = input;
  const origin = resolveOrigin(site.domain);
  const canonicalUrl = resolveAbsoluteUrl(canonicalPath, origin);
  const productUrl = resolveAbsoluteUrl(`/${encodeURIComponent(product.slug)}/`, origin);
  const versionText = product.version === undefined ? "" : String(product.version).trim();

  const about: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    name: product.title,
    url: productUrl,
  };
  if (product.category?.trim()) {
    about.applicationCategory = product.category.trim();
  }
  if (versionText) {
    about.softwareVersion = versionText;
  }

  const techArticle: Record<string, unknown> = {
    "@type": "TechArticle",
    headline: pageTitle,
    description: description?.trim() || product.description?.trim() || site.portalSubtitle,
    url: canonicalUrl,
    inLanguage: "en",
    image: resolveAbsoluteUrl(
      product.logoUrl || site.brandLogo || "/og-default.png",
      origin,
    ),
    ...(product.category?.trim() ? { articleSection: product.category.trim() } : {}),
    author: {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: site.brandName,
      url: `${origin}/`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    isPartOf: {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      name: site.portalTitle,
    },
    about,
    publisher: {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: site.brandName,
      url: `${origin}/`,
    },
  };

  const itemListElement = breadcrumbs.map((crumb, index) => {
    const entry: Record<string, unknown> = {
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
    };
    if (crumb.item) {
      entry.item = resolveAbsoluteUrl(crumb.item, origin);
    }
    return entry;
  });

  const breadcrumbList: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [techArticle, breadcrumbList],
  };
}
