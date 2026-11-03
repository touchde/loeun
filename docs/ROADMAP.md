# Roadmap

Requirement IDs (e.g. `ENG-03`) refer to [PRD.md](PRD.md). The task-level breakdown with sizes, dependencies and acceptance criteria is in [BACKLOG.md](BACKLOG.md).

## M0 — Foundation (done when CI is green)

- [ ] Repository, license, governance docs (README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- [ ] PRD, architecture, engine and browser-integration design docs, ADRs
- [ ] GitHub Actions: CI, security audit, PR title lint, release pipeline
- [ ] Issue/PR templates, labels, Dependabot
- [ ] Cargo workspace + pnpm workspace scaffold
- [ ] `loeun-core` empty crate with CI passing on Windows/macOS/Linux
- [ ] Tauri 2 + React app shell builds on all three OSes in CI

## M1 — Core Engine + CLI (v0.1.0)

- [ ] HTTP client setup: reqwest + rustls, HTTP/2, redirects, timeouts (ENG-01)
- [ ] Probe + filename resolution (ENG-11)
- [ ] Segment planner + workers + positional writer (ENG-02, ENG-09)
- [ ] Dynamic splitting / work stealing (ENG-03)
- [ ] Single-connection fallback (ENG-05)
- [ ] SQLite store + migrations + checkpointing (ENG-07)
- [ ] Pause/resume/cancel (ENG-06)
- [ ] Retry/backoff, error classes (ENG-08)
- [ ] Token-bucket rate limiter (ENG-10)
- [ ] Custom headers / cookies (ENG-12)
- [ ] `loeun get` CLI with progress bar (API-01)
- [ ] Fault-injection test server + kill-9 fuzz test
- [ ] Benchmark harness vs aria2/curl → `docs/BENCHMARKS.md`

## M2 — Desktop App (v0.2.0)

- [ ] Tauri shell, single instance, tray/menu bar (UI-04, UI-12)
- [ ] Typed command/event bindings (tauri-specta)
- [ ] Download list, filters, search (UI-01, UI-07)
- [ ] Detail panel: segment bar + speed graph (UI-02)
- [ ] New download dialog, clipboard prefill (UI-03)
- [ ] Queue with max concurrent, categories, duplicate detection (QUE-01, QUE-05, QUE-07)
- [ ] Settings screen (SET-01)
- [ ] Notifications, themes (UI-05, UI-06)
- [ ] Installers: MSI/NSIS, DMG, AppImage/deb/rpm

## M3 — Browser Integration (v0.3.0)

- [ ] Native messaging host + IPC with the app (BRW-05)
- [ ] Host manifest registration + repair (all OSes, all browsers)
- [ ] MV3 extension: capture, context menus, cookie forwarding (BRW-01..04)
- [ ] Popup + options page
- [ ] Store submissions (Chrome, Edge, Firefox)

## M4 — Power Features (v0.4 – v0.9)

- [ ] Adaptive connections + per-host caps (ENG-04)
- [ ] Auth + keychain, proxies (ENG-13, ENG-14)
- [ ] Link refresh (ENG-15), checksums (ENG-16), mirrors (ENG-17)
- [ ] HLS/DASH (ENG-20), media sniffer (BRW-06)
- [ ] Multiple queues, scheduler, post-actions (QUE-02..04)
- [ ] Category rules, batch patterns, import/export (QUE-06, QUE-08, QUE-09)
- [ ] Daemon + JSON-RPC, deep links (API-02, API-03, API-05)
- [ ] Clipboard monitor, site allow/deny (BRW-07, BRW-09)
- [ ] i18n (English, Khmer), keyboard shortcuts, a11y (UI-08..10)
- [ ] Portable mode, settings import/export (SET-02, SET-03)

## M5 — v1.0.0

- [ ] Code signing + notarization on all platforms
- [ ] Signed auto-update, stable/beta channels (SET-04)
- [ ] NFR verification: throughput, memory, startup, installer size
- [ ] Documentation site (user guide, FAQ, CLI reference)
- [ ] Security review of IPC, native host, filename handling

## Post-1.0 (P2)

HTTP/3, FTP/SFTP, BitTorrent/magnet, Metalink, aria2-compatible RPC, plugin system, Safari extension, Flatpak, drop target, mobile exploration.
