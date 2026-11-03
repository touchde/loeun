# Architecture

This document describes the high-level architecture of Loeun. For the internals of the download engine, see [ENGINE_DESIGN.md](ENGINE_DESIGN.md).

## 1. Overview

```
                    ┌──────────────────────────────────────┐
                    │        Browser (Chrome/Firefox)      │
                    │   ┌──────────────────────────────┐   │
                    │   │ Loeun Extension (MV3, TS)    │   │
                    │   └──────────────┬───────────────┘   │
                    └──────────────────┼───────────────────┘
                                       │ Native Messaging (stdio JSON)
                                       ▼
                         ┌──────────────────────────┐
                         │ loeun-native-host (Rust) │
                         └────────────┬─────────────┘
                                      │ Local IPC (named pipe / Unix socket)
┌─────────────────────────────────────▼───────────────────────────────────┐
│                       Loeun Desktop (Tauri 2)                           │
│  ┌───────────────────────────────┐    ┌──────────────────────────────┐  │
│  │ UI: React + TypeScript (Vite) │◄──►│ Tauri commands & events      │  │
│  └───────────────────────────────┘    └──────────────┬───────────────┘  │
│                                                      │                  │
│  ┌───────────────────────────────────────────────────▼───────────────┐  │
│  │                        loeun-core (Rust crate)                    │  │
│  │  Manager ─ Queue/Scheduler ─ Task ─ Segment workers ─ Writer      │  │
│  │  Protocols: HTTP(S) │ (HLS/DASH) │ (FTP) │ (Torrent)              │  │
│  │  Store: SQLite      Rate limiter      Event bus                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

        loeun (CLI)  ─────┐
        loeund (daemon) ──┴──► same loeun-core crate, JSON-RPC API
```

## 2. Design Principles

1. **The engine is a library.** `loeun-core` has no UI or Tauri dependencies. Desktop, CLI, daemon and tests are all thin front-ends on top of it.
2. **Async everywhere.** One tokio runtime. Workers are cheap tasks, not OS threads.
3. **Events, not polling.** The engine sends typed events (`TaskProgress`, `TaskStateChanged`, ...) on a broadcast channel. Front-ends subscribe. The UI receives throttled progress (about 4–10 Hz).
4. **Durable by default.** Every state transition and periodic checkpoint is saved before it is reported.
5. **Fail loudly, recover quietly.** Errors are typed and retried where safe. Anything the engine can't retry is shown to the user with a fix ("Refresh link", "Check disk space").
6. **Least privilege.** The webview gets only the Tauri commands it needs (Tauri capabilities). No arbitrary filesystem or shell access from JS.

## 3. Repository Layout

```
loeun/
├── Cargo.toml                 # Cargo workspace
├── package.json               # pnpm workspace root
├── pnpm-workspace.yaml
├── crates/
│   ├── loeun-core/            # Download engine (library)
│   ├── loeun-cli/             # `loeun` CLI binary
│   ├── loeun-daemon/          # `loeund` headless daemon + JSON-RPC (M4)
│   └── loeun-native-host/     # Browser native messaging host
├── apps/
│   └── desktop/               # Tauri 2 app
│       ├── src/               # React + TS UI
│       └── src-tauri/         # Rust side (commands, tray, updater)
├── extension/                 # WebExtension (MV3), Chrome + Firefox builds
├── tests/
│   ├── e2e/                   # Cross-crate integration & fault-injection tests
│   └── fixtures/              # Test HTTP server configs, sample files
├── bench/                     # Throughput benchmarks
├── docs/                      # Documentation (this folder)
└── .github/                   # CI/CD, templates
```

## 4. Components

### 4.1 `loeun-core`

| Module | Responsibility |
|---|---|
| `manager` | Public API: `add`, `pause`, `resume`, `remove`, `list`, `subscribe` |
| `queue` | Concurrency limits, priorities, named queues, scheduler |
| `task` | One download: state machine, probe, segment plan, lifecycle |
| `segment` | Worker that downloads a byte range; reports progress; supports splitting |
| `protocol::http` | HTTP client (reqwest/hyper, rustls), range probing, redirects, cookies |
| `writer` | Preallocation, positional writes, flush/fsync policy |
| `store` | SQLite persistence (tasks, segments, settings, history) |
| `ratelimit` | Hierarchical token bucket (global → queue → task) |
| `events` | Typed event bus (`tokio::sync::broadcast`) |
| `config` | Settings model and defaults |

Public API sketch:

```rust
let engine = Engine::builder().data_dir(dir).build().await?;
let id = engine.add(AddRequest::new(url).connections(16).dest(path)).await?;
let mut rx = engine.subscribe();
engine.pause(id).await?;
engine.resume(id).await?;
```

### 4.2 Desktop app (`apps/desktop`)

- **Rust side:** owns the `Engine`. It exposes Tauri commands (`add_download`, `pause`, ...) and forwards engine events to the webview as Tauri events. It also handles the tray, notifications, the updater, the deep-link handler, single-instance enforcement and the IPC server for the native host.
- **UI side:** React 18 + TypeScript + Vite. State in Zustand, styles in Tailwind CSS. Typed bindings are generated from Rust with `tauri-specta` so the commands and types stay in sync.

### 4.3 CLI (`loeun`)

`clap`-based. Runs the engine in-process for one-off downloads, or talks to a running daemon or desktop app with `--remote`.

### 4.4 Browser extension

MV3 service worker in TypeScript. It uses `chrome.downloads.onCreated` / `onDeterminingFilename` to intercept downloads, cancels the browser's download, and sends `{url, cookies, referer, headers, filename}` to the native host. See [BROWSER_INTEGRATION.md](BROWSER_INTEGRATION.md).

### 4.5 Native messaging host

A tiny Rust binary that the browser launches. It speaks the length-prefixed stdio JSON protocol and relays messages to the running desktop app over a local IPC channel: a named pipe on Windows, a Unix domain socket on macOS and Linux. If the app isn't running, it launches it.

## 5. Data & Persistence

- **Location:** the OS data directory via `directories` (`%APPDATA%\Loeun`, `~/Library/Application Support/Loeun`, `~/.local/share/loeun`), or next to the executable in portable mode.
- **Database:** SQLite (WAL mode) via `rusqlite`, with migrations embedded in the binary. Schema is in [ENGINE_DESIGN.md §7](ENGINE_DESIGN.md#7-persistence-schema).
- **Secrets:** credentials go in the OS keychain (`keyring` crate), never in SQLite.

## 6. Concurrency Model

```
tokio runtime
 ├── Manager actor (owns task map, receives commands via mpsc)
 ├── Scheduler tick (1 s)
 ├── Task actor × N            ← one per active download
 │    ├── Segment worker × C   ← C = current connection count
 │    └── Checkpoint timer (every 2 s or 8 MiB)
 ├── Writer (per task; positional writes from a bounded channel)
 └── Event fan-out → UI / CLI / RPC
```

- Actors communicate through bounded channels, which gives natural backpressure.
- Disk writes use `spawn_blocking` / positional I/O (`pwrite` / `seek_write`) so they never block the async reactor.

## 7. Security Model

| Surface | Control |
|---|---|
| Webview → Rust | Tauri capabilities allow only the declared commands; strict CSP; no remote content in the webview |
| Extension → App | Native messaging limited to the published extension IDs (`allowed_origins`); messages schema-validated |
| Local RPC (daemon) | Loopback-only bind; random token in a user-only-readable file; off by default |
| Downloads | Filenames sanitized (no path traversal, reserved names on Windows); never auto-execute; optional Mark-of-the-Web on Windows / quarantine xattr on macOS |
| Updates | Tauri updater with Ed25519-signed manifests; HTTPS only |
| Supply chain | `cargo-deny` (licenses, advisories, bans), Dependabot, pinned GitHub Actions, SBOM with releases |

## 8. Cross-Platform Notes

| Concern | Windows | macOS | Linux |
|---|---|---|---|
| Webview | WebView2 (Evergreen bootstrapper) | WKWebView | WebKitGTK 4.1 |
| Packaging | MSI + NSIS | DMG + .app (universal) | AppImage, .deb, .rpm, Flatpak (later) |
| Signing | Azure Trusted Signing / SignPath | Developer ID + notarization | GPG-signed repos (later) |
| Sparse/prealloc | `SetFileValidData` not used; `set_len` | `fcntl(F_PREALLOCATE)` | `fallocate` |
| IPC | Named pipe | Unix socket | Unix socket |
| Native host manifest | Registry key | `~/Library/Application Support/<browser>/NativeMessagingHosts` | `~/.config/<browser>/NativeMessagingHosts` |
