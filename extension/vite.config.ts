import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { type Browser, buildManifest } from "./manifests";

const ICON_SIZES = [16, 32, 48, 128] as const;
const ASSETS = resolve(__dirname, "../assets/extension");

/** Emits manifest.json and the icons for the target browser. */
function extensionFiles(browser: Browser, version: string): Plugin {
  return {
    name: "loeun-extension-files",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: `${JSON.stringify(buildManifest(browser, version), null, 2)}\n`,
      });
      for (const size of ICON_SIZES) {
        for (const variant of ["icon", "icon-disabled"]) {
          this.emitFile({
            type: "asset",
            fileName: `icons/${variant}-${size}.png`,
            source: readFileSync(resolve(ASSETS, `${variant}-${size}.png`)),
          });
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  if (mode !== "chrome" && mode !== "firefox") {
    throw new Error(`Unknown build mode "${mode}". Use --mode chrome or --mode firefox.`);
  }
  const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as {
    version: string;
  };

  return {
    // No public/ folder: everything is emitted explicitly.
    publicDir: false,
    plugins: [extensionFiles(mode, pkg.version)],
    build: {
      outDir: `dist/${mode}`,
      emptyOutDir: true,
      target: "es2022",
      // Store reviewers read the code; keep it readable.
      minify: false,
      rollupOptions: {
        input: {
          background: resolve(__dirname, "src/background.ts"),
          popup: resolve(__dirname, "popup.html"),
        },
        output: {
          // The manifest refers to fixed file names, so no content hashes.
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  };
});
