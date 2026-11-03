# Tech Stack

The reasoning for the major choices is recorded in [`adr/`](adr/).

## Core (Rust, stable, MSRV pinned in `rust-toolchain.toml`)

| Concern | Crate | Notes |
|---|---|---|
| Async runtime | `tokio` | multi-threaded runtime |
| HTTP client | `reqwest` (+ `hyper` directly where needed) | `rustls` TLS, HTTP/2, gzip off for ranged requests |
| TLS | `rustls` + `rustls-platform-verifier` | uses OS trust store, no OpenSSL dependency |
| Persistence | `rusqlite` (bundled SQLite) + `rusqlite_migration` | WAL mode |
| Errors | `thiserror` (lib), `anyhow` (bins) | |
| Logging | `tracing`, `tracing-subscriber`, `tracing-appender` | rotating log files |
| Serialization | `serde`, `serde_json` | |
| IDs | `uuid` (v7) | time-ordered |
| Paths | `directories`, `sanitize-filename` | |
| Secrets | `keyring` | OS keychain |
| CLI | `clap`, `indicatif` | |
| Testing | `tokio::test`, `proptest`, `axum` (fault server), `criterion`, `insta` | |
| Torrent (P2) | `librqbit` | optional feature |

## Desktop

| Concern | Choice |
|---|---|
| Shell | Tauri 2 (+ plugins: tray, notification, updater, single-instance, deep-link, autostart, clipboard, dialog, opener) |
| UI framework | React 18 + TypeScript (strict) |
| Bundler | Vite |
| Styling | Tailwind CSS + Radix UI primitives |
| State | Zustand |
| Charts | uPlot (tiny, fast for the live speed graph) |
| i18n | i18next |
| Bindings | `tauri-specta` → generated `bindings.ts` |
| Tests | Vitest + Testing Library; Playwright/WebdriverIO for E2E (later) |

## Extension

TypeScript, Vite (with `@crxjs/vite-plugin` or a custom multi-manifest build), `webextension-polyfill`, Vitest.

## Tooling

| Tool | Purpose |
|---|---|
| pnpm | JS package manager / workspace |
| `cargo-deny` | license, advisory, duplicate-dependency checks |
| `cargo-nextest` | faster test runner |
| Biome | JS/TS lint + format (single fast tool) |
| `typos` | spell check in CI |
| `git-cliff` | changelog generation from Conventional Commits |
| Conventional Commits | commit/PR title convention → semver + changelog |

## Version Policy
- Rust: latest stable in CI; MSRV = stable minus 2 releases, checked in CI.
- Node: active LTS (`.nvmrc`).
- All GitHub Actions use major-version tags and are updated by Dependabot; release workflows are pinned to commit SHAs before v1.0.
