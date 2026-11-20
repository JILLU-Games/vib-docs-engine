import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeThemeMode,
  resolveInitialTheme,
  resolveThemeFromSearch,
  syncThemeQueryInUrl,
} from "./theme";

test("normalizeThemeMode accepts light/dark case-insensitively and rejects invalid values", () => {
  assert.equal(normalizeThemeMode("light"), "light");
  assert.equal(normalizeThemeMode(" DARK "), "dark");
  assert.equal(normalizeThemeMode("Light"), "light");
  assert.equal(normalizeThemeMode("system"), null);
  assert.equal(normalizeThemeMode(""), null);
  assert.equal(normalizeThemeMode(null), null);
});

test("resolveThemeFromSearch supports ?theme= and ?themes= alias across query strings", () => {
  assert.equal(resolveThemeFromSearch("?theme=light"), "light");
  assert.equal(resolveThemeFromSearch("?theme=dark"), "dark");
  assert.equal(resolveThemeFromSearch("?themes=light"), "light");
  assert.equal(resolveThemeFromSearch("?foo=1&themes=DARK"), "dark");
  assert.equal(resolveThemeFromSearch("?theme=blue&themes=light"), "light");
  assert.equal(resolveThemeFromSearch("?theme=invalid"), null);
  assert.equal(resolveThemeFromSearch(""), null);
});

test("resolveInitialTheme prioritizes URL query over stored theme and falls back cleanly", () => {
  assert.deepEqual(resolveInitialTheme("?theme=light", "dark"), {
    theme: "light",
    fromQuery: true,
  });
  assert.deepEqual(resolveInitialTheme("?themes=dark", "light"), {
    theme: "dark",
    fromQuery: true,
  });
  assert.deepEqual(resolveInitialTheme("?theme=unknown", "light"), {
    theme: "light",
    fromQuery: false,
  });
  assert.deepEqual(resolveInitialTheme("", null), {
    theme: "dark",
    fromQuery: false,
  });
});

test("syncThemeQueryInUrl updates active ?theme/?themes param while leaving clean URLs untouched", () => {
  assert.equal(syncThemeQueryInUrl("https://docs.vib.tools/calgrid/", "light"), null);
  assert.equal(
    syncThemeQueryInUrl("https://docs.vib.tools/calgrid/?q=setup", "light"),
    null,
  );
  assert.equal(
    syncThemeQueryInUrl(
      "https://docs.vib.tools/calgrid/getting-started/?theme=light#install",
      "dark",
    ),
    "/calgrid/getting-started/?theme=dark#install",
  );
  assert.equal(
    syncThemeQueryInUrl(
      "https://docs.vib.tools/?q=dns&themes=dark",
      "light",
    ),
    "/?q=dns&theme=light",
  );
});
