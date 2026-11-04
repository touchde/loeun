import { afterEach, describe, expect, it, vi } from "vitest";
import { buildManifest, FIREFOX_ID } from "../manifests";
import { installChromeMock } from "./test/chrome";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("background", () => {
  it("registers an onInstalled listener that logs the version", async () => {
    const { addListener } = installChromeMock("1.2.3");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    const { onInstalled } = await import("./background");
    expect(addListener).toHaveBeenCalledWith(onInstalled);

    onInstalled({ reason: "install" } as chrome.runtime.InstalledDetails);
    expect(info).toHaveBeenCalledWith("Loeun extension install: v1.2.3");
  });
});

describe("popup", () => {
  it("shows the extension version", async () => {
    installChromeMock("4.5.6");
    document.body.innerHTML = `<p id="version"></p>`;

    await import("./popup/popup");
    expect(document.getElementById("version")?.textContent).toBe("Extension v4.5.6");
  });
});

describe("manifests", () => {
  it("uses a service worker on Chrome", () => {
    const m = buildManifest("chrome", "0.1.0");
    expect(m.manifest_version).toBe(3);
    expect(m.version).toBe("0.1.0");
    expect(m.background).toEqual({ service_worker: "background.js", type: "module" });
    expect(m).not.toHaveProperty("browser_specific_settings");
  });

  it("uses background scripts and a gecko id on Firefox", () => {
    const m = buildManifest("firefox", "0.1.0");
    expect(m.background).toEqual({ scripts: ["background.js"], type: "module" });
    expect(m.browser_specific_settings).toEqual({
      gecko: { id: FIREFOX_ID, strict_min_version: "128.0" },
    });
  });
});
