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

async function resolveInternalHref(href) {
  const withoutQueryOrHash = href.split(/[?#]/, 1)[0];
  if (withoutQueryOrHash === "")
    return exists(path.join(distDirectory, "index.html"));

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(withoutQueryOrHash);
  } catch {
    return false;
  }
  const candidatePath = path.resolve(distDirectory, `.${decodedPath}`);
  const relative = path.relative(distDirectory, candidatePath);
  if (
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  )
    return false;

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

async function main() {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const requiredFiles = [
      "index.html",
      "404.html",
      "robots.txt",
      "sitemap-index.xml",
      "llms.txt",
      path.join("pagefind", "pagefind.js"),
    ];
    for (const file of requiredFiles) {
      const filePath = path.join(distDirectory, file);
      if (!(await exists(filePath)))
        missingFiles.push(path.relative(projectRoot, filePath));
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
      }
    }

    const htmlFiles = await walkHtml(distDirectory);
    for (const htmlFile of htmlFiles) {
      const html = await fs.readFile(htmlFile, "utf8");
      const hrefPattern = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
      for (const match of html.matchAll(hrefPattern)) {
        const href = (match[1] ?? match[2] ?? "").replace(/&amp;/g, "&");
        if (!href.startsWith("/") || href.startsWith("//")) continue;
        if (!(await resolveInternalHref(href))) {
          brokenLinks.push(
            `${path.relative(distDirectory, htmlFile)} -> ${href}`,
          );
        }
      }
    }

    if (missingFiles.length || brokenLinks.length) {
      console.error("Build verification failed.");
      if (missingFiles.length) {
        console.error("Missing files:");
        for (const file of missingFiles) console.error(`  - ${file}`);
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
