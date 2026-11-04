#!/usr/bin/env node
// Re-renders every PNG (and favicon.ico) in assets/ from its SVG/HTML source,
// using headless Chrome at exact pixel sizes with a transparent background.
// See docs/BRAND.md.
//
//   pnpm render-assets
//
// Set CHROME=/path/to/chrome if Chrome/Chromium isn't found automatically.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const A = (p) => join(root, "assets", p);

/** [source, output, width, height] */
const JOBS = [
  ["logo/loeun-icon.svg", "app-icon/icon-1024.png", 1024, 1024],
  ["logo/loeun-icon-macos.svg", "app-icon/icon-macos-1024.png", 1024, 1024],
  ...[16, 32, 48, 128].flatMap((s) => [
    ["logo/loeun-icon.svg", `extension/icon-${s}.png`, s, s],
    ["extension/icon-disabled.svg", `extension/icon-disabled-${s}.png`, s, s],
  ]),
  ["tray/tray-template.svg", "tray/tray-template.png", 22, 22],
  ["tray/tray-template.svg", "tray/tray-template@2x.png", 44, 44],
  ["logo/loeun-icon.svg", "tray/tray-color-32.png", 32, 32],
  ...[16, 32, 48, 192, 512].map((s) => ["logo/loeun-icon.svg", `favicon/favicon-${s}.png`, s, s]),
  ["logo/loeun-icon.svg", "favicon/apple-touch-icon.png", 180, 180],
  ["logo/loeun-lockup-light.svg", "logo/loeun-lockup-light@2x.png", 1232, 320],
  ["logo/loeun-lockup-dark.svg", "logo/loeun-lockup-dark@2x.png", 1232, 320],
  ["social/social-preview.html", "social/social-preview.png", 1280, 640],
];

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = {
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ],
    win32: [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
  }[process.platform];
  const found = candidates?.find((p) => existsSync(p));
  if (!found) {
    throw new Error("Chrome/Chromium not found. Set CHROME=/path/to/chrome.");
  }
  return found;
}

function render(chrome, work, [src, out, w, h]) {
  const srcPath = A(src);
  let page = srcPath;
  if (src.endsWith(".svg")) {
    page = join(work, `${out.replaceAll("/", "_")}.html`);
    writeFileSync(
      page,
      `<html><body style="margin:0;background:transparent"><img src="${pathToFileURL(srcPath)}" width="${w}" height="${h}" style="display:block"></body></html>`,
    );
  }
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      `--window-size=${w},${h}`,
      `--screenshot=${A(out)}`,
      pathToFileURL(page).href,
    ],
    { stdio: "ignore" },
  );
}

/** Packs PNGs into a .ico (PNG-compressed entries, supported since Windows Vista). */
function writeIco(out, sizes) {
  const pngs = sizes.map((s) => readFileSync(A(`favicon/favicon-${s}.png`)));
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((png, i) => {
    const e = 6 + 16 * i;
    const s = sizes[i] % 256;
    header.writeUInt8(s, e);
    header.writeUInt8(s, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  writeFileSync(A(out), Buffer.concat([header, ...pngs]));
}

const chrome = findChrome();
const work = mkdtempSync(join(tmpdir(), "loeun-assets-"));
for (const job of JOBS) {
  render(chrome, work, job);
  console.info(`rendered ${job[1]}`);
}
copyFileSync(A("logo/loeun-icon.svg"), A("favicon/favicon.svg"));
writeIco("favicon/favicon.ico", [16, 32, 48]);
console.info("wrote favicon/favicon.svg, favicon/favicon.ico");
console.info(
  "Next: regenerate app icons with `pnpm --filter desktop tauri icon` (see docs/BRAND.md).",
);
