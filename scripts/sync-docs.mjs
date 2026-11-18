import matter from "gray-matter";
import { execFileSync } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const docsOutput = path.join(projectRoot, "src", "content", "docs");
const logosOutput = path.join(projectRoot, "public", "logos");
const generatedOutput = path.join(projectRoot, "src", "generated");
const siteConfigPath = path.join(projectRoot, "config", "site.config.json");
const projectsConfigPath = path.join(projectRoot, "config", "projects.json");
const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/,
    "must be a valid 3, 4, 6, or 8 digit hexadecimal CSS color",
  );
const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "must use HTTP or HTTPS");

const siteConfigSchema = z.object({
  portalTitle: z.string().trim().min(1),
  portalSubtitle: z.string(),
  domain: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "https:", "must use HTTPS"),
  brandName: z.string().trim().min(1),
  brandLogo: z.string().trim().min(1),
  defaultAccent: hexColorSchema,
  navLinks: z.array(
    z.object({
      label: z.string().trim().min(1),
      href: z
        .string()
        .trim()
        .min(1)
        .refine(
          (value) =>
            value.startsWith("/") || httpUrlSchema.safeParse(value).success,
          "must be a root-relative path or HTTP(S) URL",
        ),
    }),
  ),
});

const projectSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase URL-safe slug"),
    category: z.string().trim().min(1),
    accentColor: hexColorSchema,
    repoUrl: z.string().optional(),
    localPath: z.string().optional(),
    secretKey: z.string().trim().optional(),
    gitToken: z.string().trim().optional(),
    gitTokenEnv: z.string().trim().optional(),
    gitUsername: z.string().trim().optional(),
    branch: z.string().trim().min(1).default("main"),
    docsPath: z.string().trim().min(1).default("docs"),
    ctaLabel: z.string().trim().min(1).optional(),
    ctaUrl: httpUrlSchema.optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    version: z.union([z.string(), z.number()]).optional(),
  })
  .superRefine((project, context) => {
    if (!project.localPath && !project.repoUrl) {
      context.addIssue({
        code: "custom",
        message: "repoUrl is required unless localPath is set",
        path: ["repoUrl"],
      });
    }
    if (project.repoUrl) {
      const isSupportedUrl =
        /^https:\/\//i.test(project.repoUrl) ||
        /^ssh:\/\//i.test(project.repoUrl) ||
        /^[^@\s]+@[^:\s]+:.+/.test(project.repoUrl);
      if (!isSupportedUrl) {
        context.addIssue({
          code: "custom",
          message: "repoUrl must use HTTPS or SSH Git transport",
          path: ["repoUrl"],
        });
      }
      if (/^https:\/\//i.test(project.repoUrl)) {
        const parsedRepoUrl = new URL(project.repoUrl);
        if (parsedRepoUrl.username || parsedRepoUrl.password) {
          context.addIssue({
            code: "custom",
            message:
              "repoUrl must not contain credentials; use secretKey or GIT_TOKEN instead",
            path: ["repoUrl"],
          });
        }
      }
    }
    for (const [field, value] of [
      ["docsPath", project.docsPath],
      ["localPath", project.localPath],
    ]) {
      if (
        value &&
        (path.isAbsolute(value) ||
          value.includes("\\") ||
          value.split("/").some((part) => part === ".."))
      ) {
        context.addIssue({
          code: "custom",
          message: `${field} must be a relative path without traversal`,
          path: [field],
        });
      }
    }
  });

function parseJsonFile(filePath) {
  return JSON.parse(requireText(filePath));
}

function requireText(filePath) {
  return readFileSync(filePath, "utf8");
}

function sanitizeError(error, secrets = []) {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of secrets.filter(Boolean))
    message = message.split(secret).join("[REDACTED]");
  return message.replace(/https:\/\/[^/@\s]+@/gi, "https://[REDACTED]@");
}

async function clearOutputDirectory(
  directory,
  preservedNames = new Set([".gitkeep"]),
) {
  await fs.mkdir(directory, { recursive: true });
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (preservedNames.has(entry.name)) continue;
    if (entry.isDirectory()) {
      await clearOutputDirectory(entryPath, preservedNames);
      const remaining = await fs.readdir(entryPath);
      if (remaining.length === 0) await fs.rmdir(entryPath);
    } else {
      await fs.rm(entryPath, { recursive: true, force: true });
    }
  }
}

function assertWithin(parent, candidate, label) {
  const relative = path.relative(parent, candidate);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} resolves outside the allowed directory`);
  }
}

async function copyTree(source, destination) {
  const sourceStat = await fs.lstat(source);
  if (!sourceStat.isDirectory())
    throw new Error(`Documentation source is not a directory: ${source}`);
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(
        `Symbolic links are not allowed in documentation: ${sourcePath}`,
      );
    if (entry.isDirectory()) {
      await copyTree(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function normalizeDocsTree(directory, relativeDirectory = "") {
  const initialEntries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of initialEntries) {
    if (entry.isFile() && entry.name.toLowerCase() === "manifest.md") {
      await fs.rm(path.join(directory, entry.name), { force: true });
    }
  }

  const afterManifestEntries = await fs.readdir(directory, {
    withFileTypes: true,
  });
  const hasExplicitIndex = afterManifestEntries.some(
    (entry) => entry.isFile() && /^index\.mdx?$/i.test(entry.name),
  );
  const readmeEntries = afterManifestEntries.filter(
    (entry) => entry.isFile() && /^readme\.mdx?$/i.test(entry.name),
  );

  for (const [index, readmeEntry] of readmeEntries.entries()) {
    const readmePath = path.join(directory, readmeEntry.name);
    if (hasExplicitIndex || index > 0) {
      await fs.rm(readmePath, { force: true });
    } else {
      const ext =
        path.extname(readmeEntry.name).toLowerCase() === ".mdx"
          ? ".mdx"
          : ".md";
      await fs.rename(readmePath, path.join(directory, `index${ext}`));
    }
  }

  const currentEntries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of currentEntries) {
    const entryPath = path.join(directory, entry.name);
    const relPath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    if (entry.isDirectory()) {
      await normalizeDocsTree(entryPath, relPath);
      const remaining = await fs.readdir(entryPath);
      if (remaining.length === 0) await fs.rmdir(entryPath);
    } else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
      const source = await fs.readFile(entryPath, "utf8");
      const { data } = matter(source);
      if (data.draft !== undefined && typeof data.draft !== "boolean") {
        throw new Error(`Frontmatter draft in ${relPath} must be a boolean`);
      }
      if (data.draft === true) {
        await fs.rm(entryPath, { force: true });
      }
    }
  }
}

async function resolveRootIndexPath(directory) {
  for (const candidate of ["index.md", "index.mdx"]) {
    const fullPath = path.join(directory, candidate);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {}
  }
  throw new Error(
    `Missing required root index.md (or README.md) in ${directory}`,
  );
}

function resolveSecretValue(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return "";
  if (trimmed.startsWith("$")) {
    return (process.env[trimmed.slice(1).trim()] || "").trim();
  }
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed) && process.env[trimmed]) {
    return (process.env[trimmed] || "").trim();
  }
  return trimmed;
}

function resolveProjectAuth(project, globalToken = "") {
  const explicitToken =
    resolveSecretValue(project.secretKey) ||
    resolveSecretValue(project.gitToken) ||
    (project.gitTokenEnv
      ? (process.env[project.gitTokenEnv.trim()] || "").trim()
      : "");
  const username =
    resolveSecretValue(project.gitUsername) ||
    (process.env.GIT_USERNAME || "").trim();
  return {
    explicitToken,
    fallbackToken: (globalToken || "").trim(),
    username,
  };
}

function authenticatedCloneUrl(repoUrl, token, username = "") {
  if (!token || !repoUrl.toLowerCase().startsWith("https://")) return repoUrl;
  const parsed = new URL(repoUrl);
  const defaultUser = parsed.hostname.toLowerCase().includes("gitlab")
    ? "oauth2"
    : "x-access-token";
  parsed.username = username || process.env.GIT_USERNAME || defaultUser;
  parsed.password = token;
  return parsed.toString();
}

function runGitSparseClone(cloneUrl, branch, docsPath, destination) {
  execFileSync(
    "git",
    [
      "clone",
      "--depth",
      "1",
      "--filter=blob:none",
      "--sparse",
      "--branch",
      branch,
      cloneUrl,
      destination,
    ],
    {
      cwd: projectRoot,
      stdio: "pipe",
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GCM_INTERACTIVE: "never",
        GIT_ASKPASS: "",
        SSH_ASKPASS: "",
      },
    },
  );
  execFileSync("git", ["sparse-checkout", "set", docsPath], {
    cwd: destination,
    stdio: "pipe",
    encoding: "utf8",
  });
}

async function cloneAndCheckout(project, destination, token) {
  const { explicitToken, fallbackToken, username } = resolveProjectAuth(
    project,
    token,
  );
  if (explicitToken) {
    const cloneUrl = authenticatedCloneUrl(
      project.repoUrl,
      explicitToken,
      username,
    );
    runGitSparseClone(cloneUrl, project.branch, project.docsPath, destination);
    return;
  }

  try {
    runGitSparseClone(
      project.repoUrl,
      project.branch,
      project.docsPath,
      destination,
    );
  } catch (publicCloneError) {
    if (!fallbackToken || !project.repoUrl.toLowerCase().startsWith("https://")) {
      throw publicCloneError;
    }
    await fs.rm(destination, { recursive: true, force: true });
    const fallbackUrl = authenticatedCloneUrl(
      project.repoUrl,
      fallbackToken,
      username,
    );
    runGitSparseClone(
      fallbackUrl,
      project.branch,
      project.docsPath,
      destination,
    );
  }
}

function formatSlug(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function metadataString(value, field, project) {
  if (value === undefined || value === null || value === "") return "";
  if (
    field === "version" &&
    (typeof value === "string" || typeof value === "number")
  )
    return String(value);
  if (typeof value !== "string")
    throw new Error(
      `${field} frontmatter for ${project.slug} must be a string`,
    );
  return value.trim();
}

function titleFromMarkdown(markdown) {
  const heading = /^\s*#\s+(.+?)\s*#*\s*$/m.exec(markdown)?.[1];
  return heading?.replace(/\s+#+$/, "").trim() || "";
}

async function findLogo(sourceDirectory, project) {
  const directories = [
    sourceDirectory,
    path.join(sourceDirectory, "assets"),
    path.join(sourceDirectory, "images"),
  ];
  const names = ["logo.svg", "logo.png", "icon.svg", "icon.png"];
  for (const directory of directories) {
    for (const name of names) {
      const candidate = path.join(directory, name);
      try {
        const stat = await fs.lstat(candidate);
        if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
        const buffer = await fs.readFile(candidate);
        const extension = path.extname(name).toLowerCase();
        if (extension === ".png") {
          const signature = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          ]);
          if (!buffer.subarray(0, 8).equals(signature)) continue;
        } else {
          const svg = buffer.toString("utf8");
          if (
            !/<svg\b/i.test(svg) ||
            /<script\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:)/i.test(
              svg,
            )
          )
            continue;
        }
        const target = path.join(logosOutput, `${project.slug}${extension}`);
        await fs.copyFile(candidate, target);
        return `/logos/${project.slug}${extension}`;
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }
  return null;
}

async function loadSidebarBuilder() {
  const sourcePath = path.join(projectRoot, "src", "utils", "sidebar.ts");
  const source = await fs.readFile(sourcePath, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  return (await import(moduleUrl)).buildSidebar;
}

async function syncProject(project, buildSidebar, token) {
  const contentDirectory = path.join(docsOutput, project.slug);
  let temporaryDirectory;
  try {
    let sourceDirectory;
    const selfDocsCandidate = path.resolve(projectRoot, project.docsPath);
    const defaultLocalDocsCandidate = path.resolve(projectRoot, "docs");
    if (project.localPath) {
      sourceDirectory = path.resolve(projectRoot, project.localPath);
      assertWithin(projectRoot, sourceDirectory, "localPath");
    } else if (project.slug === "vib-docs-engine") {
      assertWithin(projectRoot, selfDocsCandidate, "docsPath");
      const stat = await fs.lstat(selfDocsCandidate).catch(() => null);
      if (stat?.isDirectory()) {
        sourceDirectory = selfDocsCandidate;
      }
    } else if (
      typeof project.repoUrl === "string" &&
      project.repoUrl.includes("YOUR_ORG")
    ) {
      assertWithin(projectRoot, defaultLocalDocsCandidate, "docs");
      const stat = await fs.lstat(defaultLocalDocsCandidate).catch(() => null);
      if (stat?.isDirectory()) {
        console.warn(
          `Warning [${project.slug}]: repoUrl uses starter placeholder (${project.repoUrl}); using local ./docs fixture for smoke build.`,
        );
        sourceDirectory = defaultLocalDocsCandidate;
      }
    }

    if (!sourceDirectory) {
      temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "vib-docs-sync-"),
      );
      const checkoutDirectory = path.join(temporaryDirectory, "checkout");
      await cloneAndCheckout(project, checkoutDirectory, token);
      sourceDirectory = path.join(checkoutDirectory, project.docsPath);
    }

    await copyTree(sourceDirectory, contentDirectory);
    await normalizeDocsTree(contentDirectory);
    const indexPath = await resolveRootIndexPath(contentDirectory);

    const indexSource = await fs.readFile(indexPath, "utf8");
    const parsedIndex = matter(indexSource);
    const frontmatter = parsedIndex.data;
    const title =
      metadataString(frontmatter.title, "title", project) ||
      project.title ||
      titleFromMarkdown(parsedIndex.content) ||
      formatSlug(project.slug);
    const description =
      metadataString(frontmatter.description, "description", project) ||
      project.description ||
      "";
    const version =
      metadataString(frontmatter.version, "version", project) ||
      (project.version === undefined ? "" : String(project.version));
    const logoUrl = await findLogo(contentDirectory, project);
    const navigation = await buildSidebar({
      docsRoot: contentDirectory,
      projectSlug: project.slug,
      readDirectory: (directory) =>
        fs.readdir(directory, { withFileTypes: true }),
      readTextFile: (filePath) => fs.readFile(filePath, "utf8"),
      parseFrontmatter: (source) => matter(source).data,
      joinPath: path.join,
    });
    const {
      localPath,
      secretKey,
      gitToken,
      gitTokenEnv,
      gitUsername,
      ...manifestProject
    } = project;

    return {
      ...manifestProject,
      title,
      description,
      version,
      logoUrl,
      sidebar: navigation.sidebar,
      flatPages: navigation.flatPages,
    };
  } catch (error) {
    await fs.rm(contentDirectory, { recursive: true, force: true });
    await fs.rm(path.join(logosOutput, `${project.slug}.svg`), { force: true });
    await fs.rm(path.join(logosOutput, `${project.slug}.png`), { force: true });
    throw error;
  } finally {
    if (temporaryDirectory)
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function main() {
  const rawSiteConfig = parseJsonFile(siteConfigPath);
  const siteResult = siteConfigSchema.safeParse(rawSiteConfig);
  if (!siteResult.success) {
    throw new Error(
      `Invalid config/site.config.json: ${siteResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  }
  const siteConfig = siteResult.data;
  const preservedLogos = new Set([".gitkeep", "vib-tools.svg"]);
  if (siteConfig.brandLogo.startsWith("/logos/")) {
    preservedLogos.add(path.posix.basename(siteConfig.brandLogo));
  }

  await Promise.all([
    clearOutputDirectory(docsOutput),
    clearOutputDirectory(logosOutput, preservedLogos),
    clearOutputDirectory(generatedOutput),
  ]);
  const rawProjects = parseJsonFile(projectsConfigPath);
  if (!Array.isArray(rawProjects))
    throw new Error("config/projects.json must contain a JSON array");
  const projects = rawProjects.map((project, index) => {
    const result = projectSchema.safeParse(project);
    if (!result.success) {
      throw new Error(
        `Invalid project at config/projects.json[${index}]: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    }
    return result.data;
  });
  const slugs = new Set();
  for (const project of projects) {
    if (slugs.has(project.slug))
      throw new Error(`Duplicate project slug: ${project.slug}`);
    slugs.add(project.slug);
  }

  const buildSidebar = await loadSidebarBuilder();
  const syncedProjects = [];
  const token = process.env.GIT_TOKEN;
  for (const project of projects) {
    try {
      syncedProjects.push(await syncProject(project, buildSidebar, token));
      console.log(`Synced ${project.slug}`);
    } catch (error) {
      const secretsToRedact = [
        token,
        project.secretKey,
        project.gitToken,
        resolveSecretValue(project.secretKey),
        resolveSecretValue(project.gitToken),
      ];
      console.warn(
        `Warning: could not sync ${project.slug}: ${sanitizeError(error, secretsToRedact)}`,
      );
    }
  }
  if (projects.length > 0 && syncedProjects.length === 0)
    throw new Error(
      "No projects synced successfully; refusing to write an empty manifest",
    );

  const categories = [
    ...new Set(syncedProjects.map((project) => project.category)),
  ];
  const manifest = {
    generatedAt: new Date().toISOString(),
    site: siteConfig,
    categories,
    projects: syncedProjects,
  };
  await fs.mkdir(generatedOutput, { recursive: true });
  await fs.writeFile(
    path.join(generatedOutput, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Wrote manifest for ${syncedProjects.length} project(s)`);
}

main().catch((error) => {
  console.error(
    `Documentation sync failed: ${sanitizeError(error, [process.env.GIT_TOKEN])}`,
  );
  process.exitCode = 1;
});
