# Brand Guide

<p align="center"><img src="../assets/logo/loeun-icon.svg" width="120" alt="Loeun icon"></p>

## The mark: "Bolt"

A lightning bolt whose lower stroke turns into a download arrow, for **speed + download** in one shape. *Loeun* (លឿន) means "fast" in Khmer.

## Name

- Wordmark and product name: **loeun**, always lowercase in the logo.
- In running text, "Loeun" is fine at the start of a sentence. Commands, packages and URLs are lowercase: `loeun`, `loeun-core`, `loeund`.
- Khmer: **លឿន** — use alongside the Latin name, never instead of it in the app UI.

## Colour

| Token | Hex | Use |
|---|---|---|
| `ember-400` | `#FFB020` | Gradient start (top-left), highlights, accent on dark |
| `ember-600` | `#FF4D2E` | Gradient end (bottom-right), primary accent on light |
| `ink-900` | `#0F1013` | Dark backgrounds |
| `ink-800` | `#17181C` | Text on light, wordmark (light variant) |
| `paper-50` | `#F1F0EC` | Text on dark, wordmark (dark variant) |
| `off-500` | `#A3A4AB` → `#5C5E66` | Disabled / "capture off" icon |

The icon gradient runs **diagonally from top-left to bottom-right** (`#FFB020 → #FF4D2E`). The glyph is always pure white `#FFFFFF` on the gradient.

For UI accents, use `ember-600` on light backgrounds and `ember-400` on dark backgrounds, so contrast holds in both themes.

## Assets

| File | Use |
|---|---|
| `assets/logo/loeun-icon.svg` | Master app icon (full-bleed rounded square, 1024 grid, radius 230) |
| `assets/logo/loeun-icon-macos.svg` | macOS icon on Apple's grid (824 px body, shadow, transparent margin) |
| `assets/logo/loeun-mark.svg` | Glyph only, `currentColor`, for one-colour use |
| `assets/logo/loeun-wordmark-{light,dark}.svg` | Wordmark only |
| `assets/logo/loeun-lockup-{light,dark}.svg` (+ `@2x.png`) | Icon + wordmark, horizontal |
| `assets/app-icon/icon-1024.png` | Source for `pnpm tauri icon` (Windows/Linux) |
| `assets/app-icon/icon-macos-1024.png` | Source for the macOS `.icns` |
| `assets/tray/tray-template{,@2x}.png` | macOS menu-bar template image (black + alpha; macOS recolours it) |
| `assets/tray/tray-color-32.png` | Windows / Linux tray |
| `assets/extension/icon-{16,32,48,128}.png` | Browser extension, capture on |
| `assets/extension/icon-disabled-*.png` | Browser extension, capture off |
| `assets/favicon/*` | `favicon.ico` (16/32/48), `favicon.svg`, PNG sizes, `apple-touch-icon.png` |
| `assets/social/social-preview.png` | GitHub social preview (1280×640). Source: `social-preview.html` |

### Generating platform icons

Once the Tauri app is scaffolded (M0):

```bash
pnpm --filter desktop tauri icon ../../assets/app-icon/icon-1024.png
# then replace the generated icon.icns with one built from icon-macos-1024.png:
pnpm --filter desktop tauri icon ../../assets/app-icon/icon-macos-1024.png -o /tmp/mac && cp /tmp/mac/icon.icns apps/desktop/src-tauri/icons/
```

Tray icon on macOS: load `tray-template@2x.png` with `icon_as_template(true)`.

## Clear space & minimum size

- Keep clear space around the icon of at least **25% of its width** on all sides.
- In the lockup, the gap between icon and wordmark equals **25% of the icon height**. Don't change it.
- Minimum sizes: icon **16 px**; lockup **96 px** wide.

## Don'ts

- Don't recolour the gradient or the glyph (outside the defined "off" state).
- Don't rotate, skew, outline or add effects to the mark.
- Don't put the full-colour icon on a busy photo without a solid backing.
- Don't set the wordmark in a font; use the SVG.
- Don't place other products' branding next to ours in a way that suggests affiliation.

## Re-rendering PNGs

The PNGs are rendered from the SVGs with headless Chrome at exact pixel sizes (transparent background):

```bash
chrome --headless=new --force-device-scale-factor=1 --default-background-color=00000000 \
  --window-size=1024,1024 --screenshot=icon-1024.png wrapper.html
```

Run `pnpm render-assets` to regenerate every PNG and `favicon.ico` from the sources (`scripts/render-assets.mjs`). It finds Chrome/Chromium automatically; set `CHROME=/path/to/chrome` otherwise. Output is deterministic, so an unchanged source produces no git diff.
