import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..", "..");

const TRACKER_PACKAGES = [
  "@vercel/analytics",
  "@vercel/speed-insights",
  "@next/third-parties",
  "react-ga",
  "react-ga4",
  "posthog-js",
  "mixpanel-browser",
  "@segment/analytics-next",
  "@amplitude/analytics-browser",
  "@sentry/nextjs",
  "@datadog/browser-rum",
  "@hotjar/browser",
  "logrocket",
  "@fullstory/browser",
];

const TRACKER_SNIPPETS = [
  "googletagmanager.com",
  "google-analytics.com",
  "gtag(",
  "plausible.io",
  "static.hotjar.com",
  "connect.facebook.net",
  "adsbygoogle",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|jsx?|css)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("no third-party analytics, ads or trackers", () => {
  it("has no tracking packages installed", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((dep) => TRACKER_PACKAGES.includes(dep))).toEqual([]);
  });

  it("has no tracking scripts in the app source", () => {
    const offenders = sourceFiles(join(root, "src")).filter((file) => {
      const text = readFileSync(file, "utf8");
      return TRACKER_SNIPPETS.some((snippet) => text.includes(snippet));
    });
    expect(offenders).toEqual([]);
  });
});
