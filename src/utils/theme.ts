const HEX_COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const DEFAULT_ACCENT = "#2563eb";

export function resolveAccentColor(
  projectAccent?: string,
  siteDefault?: string,
): string {
  if (projectAccent && HEX_COLOR_PATTERN.test(projectAccent)) {
    return projectAccent;
  }
  if (siteDefault && HEX_COLOR_PATTERN.test(siteDefault)) {
    return siteDefault;
  }
  return DEFAULT_ACCENT;
}

export function getMonogram(title: string): string {
  const words = title
    .trim()
    .split(/[\s_-]+/u)
    .filter(Boolean);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
      .join("")
      .toLocaleUpperCase();
  }

  const word = words[0] ?? "";
  const capitals = [...word].filter((character) => /\p{Lu}/u.test(character));
  if (capitals.length > 1) {
    return capitals.slice(0, 2).join("");
  }

  return word.match(/[\p{L}\p{N}]/u)?.[0]?.toLocaleUpperCase() ?? "?";
}

export function formatVersionBadge(version?: string | number | null): string {
  if (version === undefined || version === null) return "";
  const trimmed = String(version).trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/^v+/i, "").trim();
  return normalized ? `v${normalized}` : "";
}

export type ThemeMode = "light" | "dark";

export function normalizeThemeMode(value?: string | null): ThemeMode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "light" || normalized === "dark") {
    return normalized;
  }
  return null;
}

export function resolveThemeFromSearch(search: string): ThemeMode | null {
  if (typeof search !== "string" || !search.trim()) return null;
  const params = new URLSearchParams(search);
  return (
    normalizeThemeMode(params.get("theme")) ??
    normalizeThemeMode(params.get("themes"))
  );
}

export function resolveInitialTheme(
  search: string,
  storedTheme?: string | null,
  defaultTheme: ThemeMode = "dark",
): { theme: ThemeMode; fromQuery: boolean } {
  const queryTheme = resolveThemeFromSearch(search);
  if (queryTheme) {
    return { theme: queryTheme, fromQuery: true };
  }
  const saved = normalizeThemeMode(storedTheme);
  return { theme: saved ?? defaultTheme, fromQuery: false };
}

export function syncThemeQueryInUrl(
  href: string,
  nextTheme: ThemeMode,
): string | null {
  let url: URL;
  try {
    url = new URL(href, "http://localhost");
  } catch {
    return null;
  }
  if (!url.searchParams.has("theme") && !url.searchParams.has("themes")) {
    return null;
  }
  url.searchParams.delete("themes");
  url.searchParams.set("theme", nextTheme);
  return `${url.pathname}${url.search}${url.hash}`;
}

