import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDirectory = path.join(projectRoot, "dist");
const manifestPath = path.join(
  projectRoot,
  "src",
  "generated",
  "manifest.json",
);
const missingFiles = [];
const brokenLinks = [];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkHtml(directory) {
  const htmlFiles = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      htmlFiles.push(...(await walkHtml(entryPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      htmlFiles.push(entryPath);
    }
  }
  return htmlFiles;
}

function routeToHtml(route) {
  const cleanRoute = route.split(/[?#]/, 1)[0];
  const segments = cleanRoute.split("/").filter(Boolean);
  return path.join(distDirectory, ...segments, "index.html");
}

function routeToMarkdownFile(route, productSlug) {
  const cleanRoute = route.split(/[?#]/, 1)[0];
  const segments = cleanRoute.split("/").filter(Boolean).slice(1);
  const mdSlug = segments.length > 0 ? segments.join("/") : "index";
  return path.join(distDirectory, productSlug, `${mdSlug}.md`);
}

function isInternalReference(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return false;
  }
  return true;
}

function resolveCandidatePath(rawRef, sourceHtmlFile) {
  const withoutQueryOrHash = rawRef.split(/[?#]/, 1)[0];
  if (withoutQueryOrHash === "") {
    return rawRef.startsWith("?") || rawRef.startsWith("#")
      ? sourceHtmlFile
      : null;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(withoutQueryOrHash);
  } catch {
    return null;
  }

  const candidatePath = decodedPath.startsWith("/")
    ? path.resolve(distDirectory, `.${decodedPath}`)
    : path.resolve(path.dirname(sourceHtmlFile), decodedPath);

  const relative = path.relative(distDirectory, candidatePath);
  if (
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  ) {
    return null;
  }

  return candidatePath;
}

async function resolveInternalHref(href, sourceHtmlFile) {
  const candidatePath = resolveCandidatePath(href, sourceHtmlFile);
  if (!candidatePath) return false;

  if (await exists(candidatePath)) {
    const stat = await fs.stat(candidatePath);
    if (stat.isFile()) return true;
    if (
      stat.isDirectory() &&
      (await exists(path.join(candidatePath, "index.html")))
    )
      return true;
  }
  if (!path.extname(candidatePath) && (await exists(`${candidatePath}.html`)))
    return true;
  if (await exists(path.join(candidatePath, "index.html"))) return true;
  return false;
}

async function resolveInternalAsset(src, sourceHtmlFile) {
  const candidatePath = resolveCandidatePath(src, sourceHtmlFile);
  if (!candidatePath) return false;

  if (await exists(candidatePath)) {
    const stat = await fs.stat(candidatePath);
    return stat.isFile();
  }
  return false;
}

async function main() {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const requiredFiles = [
      "index.html",
      "404.html",
      "robots.txt",
      "sitemap-index.xml",
      "llms.txt",
      "llms-full.txt",
      "favicon.ico",
      "favicon-96x96.png",
      "apple-touch-icon.png",
      "site.webmanifest",
      "og-default.png",
      "_headers",
      "_redirects",
      "_routes.json",
      path.join("pagefind", "pagefind.js"),
    ];
    for (const file of requiredFiles) {
      const filePath = path.join(distDirectory, file);
      if (!(await exists(filePath)))
        missingFiles.push(path.relative(projectRoot, filePath));
    }

    const brandLogo = manifest.site?.brandLogo;
    if (typeof brandLogo === "string" && brandLogo.startsWith("/")) {
      const logoDistPath = path.join(distDirectory, brandLogo.slice(1));
      if (!(await exists(logoDistPath))) {
        missingFiles.push(path.relative(projectRoot, logoDistPath));
      }
    }

    const webmanifestPath = path.join(distDirectory, "site.webmanifest");
    if (await exists(webmanifestPath)) {
      const webmanifest = JSON.parse(await fs.readFile(webmanifestPath, "utf8"));
      for (const icon of webmanifest.icons ?? []) {
        if (typeof icon?.src === "string" && icon.src.startsWith("/")) {
          const iconPath = path.join(distDirectory, icon.src.slice(1));
          if (!(await exists(iconPath))) {
            missingFiles.push(path.relative(projectRoot, iconPath));
          }
        }
      }
    }

    const cloudflareErrors = [];
    const requiredCloudflareSourceFiles = [
      "wrangler.toml",
      ".node-version",
      ".nvmrc",
      path.join("functions", "tsconfig.json"),
      path.join("functions", "api", "health.ts"),
      path.join("functions", "api", "webhook.ts"),
    ];
    for (const file of requiredCloudflareSourceFiles) {
      const filePath = path.join(projectRoot, file);
      if (!(await exists(filePath)))
        missingFiles.push(path.relative(projectRoot, filePath));
    }

    const distRoutesPath = path.join(distDirectory, "_routes.json");
    if (await exists(distRoutesPath)) {
      try {
        const routesConfig = JSON.parse(await fs.readFile(distRoutesPath, "utf8"));
        if (
          routesConfig?.version !== 1 ||
          !Array.isArray(routesConfig?.include) ||
          !Array.isArray(routesConfig?.exclude)
        ) {
          cloudflareErrors.push(
            "dist/_routes.json must specify version: 1 with include and exclude arrays",
          );
        }
      } catch (error) {
        cloudflareErrors.push(
          `dist/_routes.json is invalid JSON: ${error.message}`,
        );
      }
    }

    const distRedirectsPath = path.join(distDirectory, "_redirects");
    if (await exists(distRedirectsPath)) {
      const redirectLines = (await fs.readFile(distRedirectsPath, "utf8"))
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
      for (const line of redirectLines) {
        const sourcePattern = line.split(/\s+/)[0] || "";
        if (/^https?:\/\//i.test(sourcePattern)) {
          try {
            const parsedSource = new URL(sourcePattern);
            if (!parsedSource.hostname.endsWith(".pages.dev")) {
              cloudflareErrors.push(
                `dist/_redirects contains unsupported custom-domain source rule "${sourcePattern}" (use Cloudflare Redirect Rules instead)`,
              );
            }
          } catch {
            cloudflareErrors.push(
              `dist/_redirects contains invalid source URL "${sourcePattern}"`,
            );
          }
        }
      }
    }

    for (const project of manifest.projects ?? []) {
      if (!project?.slug || !Array.isArray(project.flatPages)) {
        missingFiles.push(
          `manifest project entry missing slug/flatPages: ${JSON.stringify(project)}`,
        );
        continue;
      }
      const llmsPath = path.join(distDirectory, project.slug, "llms.txt");
      if (!(await exists(llmsPath)))
        missingFiles.push(path.relative(projectRoot, llmsPath));
      for (const page of project.flatPages) {
        const htmlPath = routeToHtml(page.route);
        if (!(await exists(htmlPath)))
          missingFiles.push(path.relative(projectRoot, htmlPath));
        const mdPath = routeToMarkdownFile(page.route, project.slug);
        if (!(await exists(mdPath)))
          missingFiles.push(path.relative(projectRoot, mdPath));
      }
    }

    const seoErrors = [];
    const notFoundHtmlPath = path.join(distDirectory, "404.html");
    if (await exists(notFoundHtmlPath)) {
      const notFoundHtml = await fs.readFile(notFoundHtmlPath, "utf8");
      if (!/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(notFoundHtml)) {
        seoErrors.push("dist/404.html is missing <meta name=\"robots\" content=\"noindex, ...\">");
      }
    }

    const htmlFiles = await walkHtml(distDirectory);
    const jsonLdPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    for (const htmlFile of htmlFiles) {
      const html = await fs.readFile(htmlFile, "utf8");
      const relHtmlPath = path.relative(distDirectory, htmlFile);
      const jsonLdMatches = Array.from(html.matchAll(jsonLdPattern));
      if (relHtmlPath === "index.html" && jsonLdMatches.length === 0) {
        seoErrors.push("dist/index.html is missing Schema.org JSON-LD");
      }
      for (const jsonMatch of jsonLdMatches) {
        try {
          JSON.parse(jsonMatch[1]);
        } catch (error) {
          seoErrors.push(`${relHtmlPath} contains invalid JSON-LD: ${error.message}`);
        }
      }

      const hrefPattern = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
      for (const match of html.matchAll(hrefPattern)) {
        const href = (match[1] ?? match[2] ?? "").replace(/&amp;/g, "&");
        if (!isInternalReference(href)) continue;
        if (!(await resolveInternalHref(href, htmlFile))) {
          brokenLinks.push(
            `${relHtmlPath} -> ${href}`,
          );
        }
      }

      const imgSrcPattern =
        /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
      for (const match of html.matchAll(imgSrcPattern)) {
        const src = (match[1] ?? match[2] ?? "").replace(/&amp;/g, "&");
        if (!isInternalReference(src)) continue;
        if (!(await resolveInternalAsset(src, htmlFile))) {
          brokenLinks.push(
            `${relHtmlPath} -> img[src="${src}"]`,
          );
        }
      }
    }

    if (missingFiles.length || brokenLinks.length || cloudflareErrors.length || seoErrors.length) {
      console.error("Build verification failed.");
      if (missingFiles.length) {
        console.error("Missing files:");
        for (const file of missingFiles) console.error(`  - ${file}`);
      }
      if (cloudflareErrors.length) {
        console.error("Cloudflare configuration errors:");
        for (const err of cloudflareErrors) console.error(`  - ${err}`);
      }
      if (seoErrors.length) {
        console.error("SEO / AI verification errors:");
        for (const err of seoErrors) console.error(`  - ${err}`);
      }
      if (brokenLinks.length) {
        console.error("Broken internal links:");
        for (const link of brokenLinks) console.error(`  - ${link}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(
      `Build verification passed: ${htmlFiles.length} HTML files, ${requiredFiles.length} required assets, ${manifest.projects?.length ?? 0} projects, and no broken internal links.`,
    );
  } catch (error) {
    console.error(`Build verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
