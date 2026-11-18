import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const projectsPath = path.join(projectRoot, "config", "projects.json");
const temporaryProjectsPath = `${projectsPath}.${process.pid}.tmp`;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern =
  /^#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/;

function isGitRemote(value) {
  return (
    /^https:\/\//i.test(value) ||
    /^ssh:\/\//i.test(value) ||
    /^[^@\s]+@[^:\s]+:.+/.test(value)
  );
}

function validateRemote(value) {
  if (/^(?:https|ssh):\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!url.hostname) return false;
      return url.protocol === "ssh:" || (!url.username && !url.password);
    } catch {
      return false;
    }
  }
  return /^[^@\s]+@[^:\s]+:.+/.test(value);
}

async function askUntil(readline, label, validate, initialValue = "") {
  while (true) {
    const answer =
      (
        await readline.question(
          `${label}${initialValue ? ` [${initialValue}]` : ""}: `,
        )
      ).trim() || initialValue;
    const error = validate(answer);
    if (!error) return answer;
    stdout.write(`${error}\n`);
  }
}

async function createPromptReader() {
  const readline = createInterface({ input: stdin, output: stdout });
  if (stdin.isTTY) return { readline, prompts: readline };

  const answers = [];
  for await (const answer of readline) answers.push(answer);
  const prompts = {
    question: async (label) => {
      stdout.write(label);
      if (answers.length === 0)
        throw new Error("Not enough input values were provided.");
      return answers.shift();
    },
  };
  return { readline, prompts };
}

function validateDocsPath(value) {
  const trimmed = value.trim().replace(/^[\\/]+|[\\/]+$/g, "");
  if (!trimmed) return "Documentation path cannot be empty.";
  if (path.isAbsolute(value) || /^[\\/]|^[a-zA-Z]:/.test(value)) {
    return "Documentation path must be a relative path inside the repository.";
  }
  const segments = trimmed.split(/[\\/]+/).filter(Boolean);
  if (
    segments.length === 0 ||
    segments.includes("..") ||
    segments.includes(".")
  ) {
    return "Documentation path cannot contain '.' or '..' segments.";
  }
  return "";
}

async function resolveLocalPath(value) {
  if (!value || path.isAbsolute(value) || value.split(/[\\/]/).includes(".."))
    return null;
  const absolutePath = path.resolve(projectRoot, value);
  const relativePath = path.relative(projectRoot, absolutePath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  )
    return null;
  try {
    if (!(await stat(absolutePath)).isDirectory()) return null;
  } catch {
    return null;
  }
  return `./${relativePath.split(path.sep).join("/")}`;
}

async function main() {
  let projects;
  try {
    projects = JSON.parse(await readFile(projectsPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read config/projects.json: ${error.message}`);
  }
  if (!Array.isArray(projects))
    throw new Error("config/projects.json must contain a JSON array");

  const { readline, prompts } = await createPromptReader();
  try {
    const slug = await askUntil(
      prompts,
      "Project slug (lowercase letters/numbers/hyphens)",
      (value) => {
        if (!slugPattern.test(value))
          return "Use lowercase letters and numbers separated by single hyphens.";
        if (projects.some((project) => project.slug === value))
          return `Slug "${value}" already exists. Choose another.`;
        return "";
      },
    );

    const existingCategories = [
      ...new Set(projects.map((project) => project.category).filter(Boolean)),
    ];
    if (existingCategories.length)
      stdout.write(`Existing categories: ${existingCategories.join(", ")}\n`);
    const category = await askUntil(prompts, "Category", (value) =>
      value ? "" : "Category cannot be empty.",
    );

    let repositoryInput = await askUntil(
      prompts,
      "Repository URL (Git HTTPS/SSH) or local docs path",
      (value) => {
        if (isGitRemote(value))
          return validateRemote(value)
            ? ""
            : "Use a valid credential-free Git URL.";
        return "";
      },
    );
    const branch = await askUntil(
      prompts,
      "Branch",
      (value) => (value ? "" : "Branch cannot be empty."),
      "main",
    );
    const accentColor = await askUntil(
      prompts,
      "Accent color",
      (value) =>
        hexColorPattern.test(value)
          ? ""
          : "Use a 3, 4, 6, or 8 digit hex color such as #2563eb.",
      "#2563eb",
    );
    const docsPathInput = await askUntil(
      prompts,
      "Documentation path in repository",
      validateDocsPath,
      "docs",
    );
    const project = {
      slug,
      category,
      branch,
      accentColor,
      docsPath: docsPathInput
        .trim()
        .replace(/^[\\/]+|[\\/]+$/g, "")
        .split(/[\\/]+/)
        .join("/"),
    };

    if (isGitRemote(repositoryInput)) {
      project.repoUrl = repositoryInput;
    } else {
      const localPath = await resolveLocalPath(repositoryInput);
      while (!localPath) {
        stdout.write(
          "Local docs path must be an existing directory inside this engine repository, with no '..' segments.\n",
        );
        repositoryInput = await prompts.question(
          "Repository URL or local docs path: ",
        );
        if (isGitRemote(repositoryInput)) {
          if (!validateRemote(repositoryInput)) continue;
          project.repoUrl = repositoryInput.trim();
          break;
        }
        const normalizedPath = await resolveLocalPath(repositoryInput.trim());
        if (normalizedPath) {
          project.localPath = normalizedPath;
          break;
        }
      }
      if (localPath) project.localPath = localPath;
    }

    if (project.repoUrl) {
      const secretKeyInput = (
        await prompts.question(
          "Secret key / Git token for private repo (optional, leave blank for public repo): ",
        )
      ).trim();
      if (secretKeyInput) {
        project.secretKey = secretKeyInput;
        const gitUsernameInput = (
          await prompts.question(
            "Git token username (optional, e.g. oauth2 for GitLab, leave blank for auto): ",
          )
        ).trim();
        if (gitUsernameInput) {
          project.gitUsername = gitUsernameInput;
        }
      }
    }

    const ctaLabel = (await prompts.question("CTA label (optional): ")).trim();
    const ctaUrlInput = (
      await prompts.question("CTA URL (optional, HTTP(S)): ")
    ).trim();
    let validCtaUrl = "";
    if (ctaUrlInput) {
      let ctaUrl = ctaUrlInput;
      while (true) {
        try {
          const parsed = new URL(ctaUrl);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            validCtaUrl = ctaUrl;
            break;
          }
        } catch {}
        ctaUrl = (
          await prompts.question("Enter a valid HTTP(S) URL, or leave blank: ")
        ).trim();
        if (!ctaUrl) break;
      }
    }
    if (validCtaUrl) {
      project.ctaLabel = ctaLabel || "View repository";
      project.ctaUrl = validCtaUrl;
    } else if (ctaLabel) {
      stdout.write(
        "CTA URL was left blank; skipping CTA label so CTA configuration stays paired.\n",
      );
    }

    projects.push(project);
    const formatted = `${JSON.stringify(projects, null, 2)}\n`;
    await writeFile(temporaryProjectsPath, formatted, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryProjectsPath, projectsPath);
    stdout.write(`\nAdded ${slug} to config/projects.json.\n`);
    stdout.write(
      "Next: run `npm run build` to sync and build locally, or commit and push to trigger the connected deployment hook.\n",
    );
  } finally {
    readline.close();
    await rm(temporaryProjectsPath, { force: true });
  }
}

main().catch((error) => {
  console.error(`add-project failed: ${error.message}`);
  process.exitCode = 1;
});
