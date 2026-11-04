// Builds the browser-specific manifest.json from manifest.base.json.
// Chrome and Firefox differ in how MV3 background scripts are declared,
// and Firefox needs an extension id for native messaging.

import base from "./manifest.base.json" with { type: "json" };

export type Browser = "chrome" | "firefox";

export const FIREFOX_ID = "loeun@touchde.github.io";

export function buildManifest(browser: Browser, version: string): Record<string, unknown> {
  const common = { ...base, version };

  if (browser === "chrome") {
    return {
      ...common,
      minimum_chrome_version: "116",
      background: { service_worker: "background.js", type: "module" },
    };
  }

  return {
    ...common,
    background: { scripts: ["background.js"], type: "module" },
    browser_specific_settings: {
      gecko: { id: FIREFOX_ID, strict_min_version: "128.0" },
    },
  };
}
