import { vi } from "vitest";

/** Installs a minimal `chrome` global for tests. */
export function installChromeMock(version = "1.2.3") {
  const addListener = vi.fn();
  const chromeMock = {
    runtime: {
      getManifest: () => ({ version }),
      onInstalled: { addListener },
    },
  };
  vi.stubGlobal("chrome", chromeMock);
  return { addListener };
}
