# Browser Integration

## 1. Goals
- Catch downloads in the browser and hand them to Loeun with all the context needed to access them: cookies, referer, user-agent and auth headers.
- Work with Chromium browsers (Chrome, Edge, Brave, Opera, Vivaldi) and Firefox from **one TypeScript codebase**.
- Stay within Manifest V3 limits and pass store review.

## 2. Components

```
extension/
├── src/
│   ├── background.ts       # MV3 service worker (Chrome) / event page (Firefox)
│   ├── capture.ts          # download interception rules
│   ├── native.ts           # native messaging client + loopback fallback
│   ├── sniffer.ts          # media detection via webRequest (P1)
│   ├── content/            # content scripts (link collection, media button)
│   ├── popup/              # toolbar popup (status, toggle capture)
│   └── options/            # settings page
├── manifest.chrome.json
├── manifest.firefox.json
└── vite.config.ts          # builds dist/chrome and dist/firefox
```

## 3. Capture Flow

1. `chrome.downloads.onCreated` fires.
2. `capture.ts` decides whether to take over, based on:
   - Capture enabled and the site is not on the deny list
   - The file extension or MIME type matches the capture list, **or** the size is ≥ threshold (default 1 MB)
   - The bypass modifier (Alt) was not held. The content script tracks it on click.
3. If taking over: `chrome.downloads.cancel(id)` + `chrome.downloads.erase({id})`.
4. Collect context:
   - `chrome.cookies.getAll({url})` (requires the `cookies` permission and host access)
   - Referer: `downloadItem.referrer`
   - UA: `navigator.userAgent`
   - Filename hint: `downloadItem.filename`
5. Send `{type:"add", url, finalUrl, referer, cookies, userAgent, filename, fileSize, mime}` through native messaging.
6. If the host responds with an error (app not installed), restore the original browser download.

## 4. Native Messaging Protocol

- Transport: the browser launches `loeun-native-host` and talks over stdin/stdout using a 32-bit native-endian length prefix + UTF-8 JSON. Max message size is 1 MB (browser → host).
- Every message: `{ "v": 1, "id": "<uuid>", "type": "...", "payload": {...} }`.

| type | Direction | Purpose |
|---|---|---|
| `hello` | ext → host | Handshake; returns app version, capabilities |
| `add` | ext → host | Add one download |
| `add_batch` | ext → host | Add many (from "download all links") |
| `refresh_url` | ext → host | Supply a new URL for an existing task (link refresh) |
| `status` | ext → host | Get global speed / active count for the popup |
| `result` | host → ext | Response with `ok` / `error` |

The host checks every message against a JSON schema and rejects unknown fields and oversized payloads.

## 5. Host Registration

The desktop installer and the app's first run register the host manifest:

```json
{
  "name": "dev.loeun.native",
  "description": "Loeun Download Manager",
  "path": "<abs path to loeun-native-host>",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://<published-id>/"]
}
```

Firefox uses `allowed_extensions: ["loeun@loeun.dev"]`. Paths per OS and browser are listed in [ARCHITECTURE.md §8](ARCHITECTURE.md#8-cross-platform-notes). Settings include a "Repair browser integration" button that rewrites them.

## 6. Permissions (justification for store review)

| Permission | Why |
|---|---|
| `downloads` | Intercept and cancel browser downloads |
| `nativeMessaging` | Talk to the desktop app |
| `cookies` + host permissions | Forward the session so authenticated downloads work |
| `contextMenus` | "Download with Loeun" |
| `storage` | Extension settings |
| `webRequest` (P1, optional permission) | Media sniffing; requested at runtime only when the user enables it |

## 7. Known MV3 Limitations
- The service worker can be suspended. All state must be in `chrome.storage`, and the native port is reconnected on demand.
- `webRequestBlocking` isn't available in Chrome MV3, so we can't intercept *before* the browser starts the download. Cancel-and-erase on `onCreated` is the accepted pattern. A few kilobytes may be fetched by the browser first.
- Cookies marked `Partitioned` (CHIPS) need `partitionKey` handling.

## 8. Distribution
- Chrome Web Store, Microsoft Edge Add-ons, Firefox AMO (signed, listed).
- Extension version is independent of the app version, with a minimum compatible protocol `v` checked during `hello`.
