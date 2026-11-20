export interface DisplayMetadataInput {
  projectTitle?: string;
  projectDescription?: string;
  projectVersion?: string | number;
  frontmatterTitle?: string;
  frontmatterDescription?: string;
  frontmatterVersion?: string;
  extractedTitle?: string;
  extractedDescription?: string;
  extractedVersion?: string;
  markdownHeadingTitle?: string;
  fallbackSlugTitle: string;
}

export interface ResolvedDisplayMetadata {
  title: string;
  description: string;
  version: string;
}

function cleanText(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function resolveProjectDisplayMetadata(
  input: DisplayMetadataInput,
): ResolvedDisplayMetadata {
  const title =
    cleanText(input.projectTitle) ||
    cleanText(input.frontmatterTitle) ||
    cleanText(input.extractedTitle) ||
    cleanText(input.markdownHeadingTitle) ||
    cleanText(input.fallbackSlugTitle);

  const description =
    cleanText(input.projectDescription) ||
    cleanText(input.frontmatterDescription) ||
    cleanText(input.extractedDescription);

  const version =
    cleanText(input.projectVersion) ||
    cleanText(input.frontmatterVersion) ||
    cleanText(input.extractedVersion);

  return { title, description, version };
}

export function nextSparseBranchTarget(
  currentBranch: string | null | undefined,
  resolvedBranch: string | null | undefined,
  visitedBranches: ReadonlySet<string>,
  maxSwitches = 2,
): string | null {
  const current = cleanText(currentBranch);
  const target = cleanText(resolvedBranch);
  if (!current || !target || target === current) return null;
  if (visitedBranches.has(target)) return null;
  if (visitedBranches.size > maxSwitches) return null;
  return target;
}
