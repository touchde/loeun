# Loeun — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Loeun (លឿន — Khmer for "fast") |
| **Type** | Open-source, cross-platform download manager |
| **Status** | Draft v0.1 |
| **Last updated** | 2026-11-03 |
| **License** | MIT OR Apache-2.0 |

---

## 1. Summary

Loeun is a free, open-source download accelerator and manager for Windows, macOS and Linux. It aims to match and exceed Internet Download Manager (IDM) on speed, reliability and browser integration, while being cross-platform, lightweight, privacy-respecting and scriptable.

**One-line pitch:** *Everything IDM does, on every OS, open source, faster.*

## 2. Problem

- IDM is the de-facto download accelerator, but it is **Windows-only, closed-source and paid**, and its UI and architecture date from the early 2000s.
- Built-in browser downloaders use a **single connection**, can't reliably resume, and give up on flaky networks.
- Existing open-source alternatives each miss something:

| Tool | Gap |
|---|---|
| aria2 | CLI only, no browser capture out of the box, steep UX |
| Motrix | Electron (100+ MB), aria2 wrapper, slow maintenance |
| Free Download Manager | Not fully open source, heavy |
| Gopeed | Good, but limited dynamic segmentation and browser capture depth |
| AB Download Manager | JVM-based, large footprint |
| JDownloader | Java, heavy, ad-supported installer |

## 3. Goals & Non-Goals

### Goals
1. **Max throughput:** saturate the user's link whenever the server allows ranged or parallel requests.
2. **Reliable resume:** pause or resume at any time and survive app crashes, reboots and network drops with zero corruption.
3. **Seamless browser capture** in Chromium-based browsers and Firefox.
4. **Cross-platform parity** on Windows, macOS (Intel + Apple Silicon) and Linux.
5. **Lightweight:** small installer and low idle resource use (see §7).
6. **Scriptable:** CLI, headless daemon and local RPC API.
7. **Trustworthy:** open source, no telemetry by default, no ads, reproducible builds.

### Non-Goals (v1)
- Circumventing DRM or downloading content protected by technical protection measures.
- Built-in VPN/proxy service (we *support* user-configured proxies).
- Mobile apps (the architecture keeps this possible; not planned for v1).
- Cloud sync of the download list.

## 4. Target Users

| Persona | Needs |
|---|---|
| **Power downloader** (ex-IDM user) | Speed, browser capture, queue, scheduler, categories |
| **Linux/macOS user** | An IDM-class tool that exists on their OS |
| **Developer / sysadmin** | CLI, headless daemon, API, scripting, checksum verification |
| **Users on slow or unstable networks** (e.g. mobile hotspots, rural ISPs) | Robust resume, retries, speed limits, off-peak scheduling |

## 5. Functional Requirements

Priority: **P0** = MVP (v0.1–v0.3), **P1** = v1.0, **P2** = after v1.0.

### 5.1 Download Engine

| ID | Requirement | Priority |
|---|---|---|
| ENG-01 | HTTP/HTTPS downloads over HTTP/1.1 and HTTP/2 | P0 |
| ENG-02 | Multi-connection segmented download via `Range` requests (default 8, configurable 1–32 per task) | P0 |
| ENG-03 | **Dynamic segment splitting:** idle connections take over half of the largest remaining segment | P0 |
| ENG-04 | **Adaptive connection count:** add or drop connections based on measured throughput gain | P1 |
| ENG-05 | Fall back to a single connection when the server lacks range support, and say so clearly in the UI | P0 |
| ENG-06 | Pause, resume and cancel per task and globally | P0 |
| ENG-07 | Crash-safe resume: periodically saved state, validated against `ETag`, `Last-Modified` and `Content-Length` | P0 |
| ENG-08 | Automatic retry with exponential backoff and jitter; configurable max retries | P0 |
| ENG-09 | Preallocated output file with positional writes (no merge step) | P0 |
| ENG-10 | Global and per-task speed limits (token bucket) | P0 |
| ENG-11 | Resolve redirects, `Content-Disposition` filenames and MIME-based extensions | P0 |
| ENG-12 | Cookies, headers, referer and user-agent forwarded from the browser | P0 |
| ENG-13 | Authentication: Basic, Digest, Bearer; per-site saved credentials in the OS keychain | P1 |
| ENG-14 | Proxies: HTTP, HTTPS, SOCKS5; system proxy detection | P1 |
| ENG-15 | Refresh expired links: re-capture a new URL for a paused download while keeping progress | P1 |
| ENG-16 | Checksum verification (MD5/SHA-1/SHA-256/SHA-512) | P1 |
| ENG-17 | Multi-source / mirror downloads (segments spread across mirrors) | P1 |
| ENG-18 | HTTP/3 (QUIC) | P2 |
| ENG-19 | FTP / SFTP | P2 |
| ENG-20 | HLS / DASH stream download and mux (non-DRM only) | P1 |
| ENG-21 | BitTorrent and magnet links | P2 |
| ENG-22 | Metalink | P2 |

### 5.2 Queue, Scheduling & Organization

| ID | Requirement | Priority |
|---|---|---|
| QUE-01 | Download queue with max concurrent downloads (default 3) | P0 |
| QUE-02 | Multiple named queues with drag-and-drop reordering | P1 |
| QUE-03 | Scheduler: start or stop queues at set times or days | P1 |
| QUE-04 | Post-completion actions: open file or folder, sleep, shut down, run a script | P1 |
| QUE-05 | Categories (Video, Music, Documents, Archives, Programs, Other) with per-category folders | P0 |
| QUE-06 | Custom category rules (extension, domain, regex) | P1 |
| QUE-07 | Duplicate detection (same URL or file) with a rename/overwrite/skip prompt | P0 |
| QUE-08 | Batch download from a URL pattern (`file[001-100].zip`) | P1 |
| QUE-09 | Import or export a download list (text, JSON) | P1 |

### 5.3 Browser Integration

| ID | Requirement | Priority |
|---|---|---|
| BRW-01 | WebExtension (Manifest V3) for Chrome, Edge, Brave, Opera, Vivaldi and Firefox | P0 |
| BRW-02 | Intercept browser downloads by file type and size threshold, with a bypass key | P0 |
| BRW-03 | Context menu: "Download with Loeun", "Download all links", "Download selected" | P0 |
| BRW-04 | Forward cookies, referer, user-agent and auth headers | P0 |
| BRW-05 | Communicate through Native Messaging, with a loopback HTTP fallback | P0 |
| BRW-06 | Media sniffer: detect video and audio streams on a page and show a download button | P1 |
| BRW-07 | Per-site allow or deny list for capture | P1 |
| BRW-08 | Safari extension (macOS) | P2 |
| BRW-09 | Clipboard monitor for copied download links (opt-in) | P1 |

### 5.4 Desktop Application (UI)

| ID | Requirement | Priority |
|---|---|---|
| UI-01 | Main list with name, size, progress, speed, ETA, status and connections | P0 |
| UI-02 | Detail view: per-segment progress visualization (IDM-style bar) and live speed graph | P0 |
| UI-03 | "New download" dialog: URL, filename, folder, category, connections, checksum, start now or later | P0 |
| UI-04 | System tray / menu-bar icon with global speed and quick actions | P0 |
| UI-05 | Desktop notifications on completion or failure | P0 |
| UI-06 | Light and dark themes that follow the OS | P0 |
| UI-07 | Search and filter by status, category and text | P0 |
| UI-08 | Keyboard shortcuts | P1 |
| UI-09 | Internationalization (i18n) framework; launch with English and Khmer | P1 |
| UI-10 | Accessibility: full keyboard navigation and screen-reader labels | P1 |
| UI-11 | Floating drop target for dragging links (optional) | P2 |
| UI-12 | Start at login, start minimized | P0 |

### 5.5 Automation & Integrations

| ID | Requirement | Priority |
|---|---|---|
| API-01 | `loeun` CLI with the same engine: `loeun get <url> -c 16 -o file` | P0 |
| API-02 | Headless daemon mode (`loeund`) for servers and NAS boxes | P1 |
| API-03 | Local JSON-RPC API over loopback with token auth | P1 |
| API-04 | aria2-compatible RPC subset, so existing aria2 front-ends work | P2 |
| API-05 | `loeun://` deep link handler | P1 |
| API-06 | Plugin/extractor system for site-specific resolvers | P2 |

### 5.6 Settings & Data

| ID | Requirement | Priority |
|---|---|---|
| SET-01 | Settings: default folder, connections, max concurrent, speed limit, proxy, capture rules | P0 |
| SET-02 | Portable mode: settings and database next to the executable | P1 |
| SET-03 | Settings import and export | P1 |
| SET-04 | Auto-update with signed updates, user opt-out, and stable and beta channels | P1 |

## 6. User Flows (MVP)

1. **Capture from browser:** user clicks a link → extension intercepts → Loeun shows a confirmation dialog (or starts silently, per settings) → download runs with multiple connections → notification → "Open" or "Show in folder".
2. **Paste URL:** user copies a URL → `Ctrl/Cmd+N` pre-fills it from the clipboard → Start.
3. **Resume after crash:** app restarts → interrupted tasks show as *Paused (resumable)* → Resume → engine validates the server copy → continues from the saved offsets.
4. **Expired link:** resume returns 403 or the ETag changed → UI prompts "Link expired — refresh address" → user re-captures from the browser → progress kept.

## 7. Non-Functional Requirements

| Area | Target |
|---|---|
| **Throughput** | ≥ 95% of available link bandwidth on a 1 Gbps link against a range-capable server; ≥ 90% at 10 Gbps for the CLI |
| **CPU** | < 10% of one core while downloading at 1 Gbps (excluding TLS-heavy edge cases) |
| **Memory** | < 60 MB RSS idle (desktop app); < 15 MB for the CLI/daemon |
| **Startup** | Cold start to interactive in < 1.0 s |
| **Installer size** | < 15 MB per platform |
| **Durability** | Zero corrupted files after a `kill -9` at random points (fuzzed in CI) |
| **Platforms** | Windows 10+, macOS 11+, Ubuntu 22.04+ / Fedora 39+ (x86_64 + aarch64) |
| **Security** | No open network ports by default; RPC loopback-only with token; signed binaries and updates; sandboxed UI webview |
| **Privacy** | No telemetry by default; optional, documented, opt-in crash reports |
| **Accessibility** | WCAG 2.1 AA for UI colors and contrast |

## 8. Success Metrics

- Benchmarks: matches or beats IDM and aria2 at equal connection counts on the published benchmark suite (`docs/BENCHMARKS.md`, created during M1).
- 1.0 released with ≤ 5 open P0 bugs.
- GitHub: 1k stars in the first 6 months after v1.0; at least 10 external contributors.
- Crash-free sessions ≥ 99.5% (from opt-in reports).

## 9. Milestones

See [ROADMAP.md](ROADMAP.md) for the detailed breakdown.

| Milestone | Scope | Exit criteria |
|---|---|---|
| **M0 — Foundation** | Repo, CI/CD, docs, workspace scaffold | CI green on all 3 OSes |
| **M1 — Core engine + CLI** (v0.1) | ENG-01..12, API-01 | Benchmark ≥ aria2; kill-9 fuzz passes |
| **M2 — Desktop app** (v0.2) | UI-01..07, UI-12, QUE-01, QUE-05, QUE-07, SET-01 | Installable builds on 3 OSes |
| **M3 — Browser integration** (v0.3) | BRW-01..05 | Published on Chrome Web Store + AMO |
| **M4 — Power features** (v0.x) | Remaining P1 items | Feature parity with IDM core |
| **M5 — v1.0** | Hardening, signing, auto-update, docs | NFR targets met |

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Servers throttling or banning many parallel connections | Slower speeds, user IP blocked | Sensible defaults (8), per-domain connection caps, back off on 429/503 |
| MV3 restrictions on download interception | Weaker capture | Use the `downloads` API + `onDeterminingFilename`; native messaging; document limits |
| Code signing costs (Apple, Windows) | Unsigned-app warnings hurt adoption | Apple Developer Program; Azure Trusted Signing or SignPath (free for OSS) for Windows |
| WebView inconsistencies (WebKitGTK on Linux) | UI bugs | Keep UI simple; test the matrix in CI; avoid bleeding-edge CSS |
| Legal concerns (piracy perception) | Store rejection | Clear acceptable-use statement; no DRM circumvention; no bundled site rippers |
| Scope creep | Late v1 | Strict P0/P1/P2 discipline; RFC process for big features |

## 11. Legal & Ethics

- Loeun is a general-purpose download tool. It **does not** circumvent DRM or access controls.
- Site-specific extractors (if ever added) live in optional plugins, not core.
- The trademark "IDM" belongs to Tonec Inc. Loeun is not affiliated with it. We compare features factually and never use their branding.

## 12. Open Questions

1. UI framework: React (larger ecosystem) or Svelte (smaller and faster)? → **Decided: React** ([ADR-0002](adr/0002-tauri-react-desktop-ui.md)); revisit if bundle size becomes a problem.
2. Torrent: embed `librqbit` or keep it as an optional plugin? → Decide at M4.
3. Should the desktop app embed the engine in-process or always talk to `loeund`? → In-process for v1 ([ADR-0001](adr/0001-rust-core-engine.md)); daemon is a separate binary sharing the crate.
4. Telemetry: opt-in crash reports only (Sentry self-hosted?) → Decide before v1.0.
