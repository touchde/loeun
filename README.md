<div align="center">

<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo/loeun-lockup-dark.svg">
    <img src="assets/logo/loeun-lockup-light.svg" alt="loeun" width="320" height="83">
  </picture>
</p>

**A fast, open-source, cross-platform download manager.**

*Loeun (លឿន) means "fast" in Khmer.*

[![CI](https://github.com/touchde/loeun/actions/workflows/ci.yml/badge.svg)](https://github.com/touchde/loeun/actions/workflows/ci.yml)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](#license)
![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

</div>

> [!WARNING]
> Loeun is in early development (pre-alpha). Nothing is ready for daily use yet. Star or watch the repo to follow progress.

## Why Loeun?

Looking for an IDM alternative on macOS or Linux, or a free and open-source one on Windows? Loeun is built for that.

| | Loeun | Browser built-in |
|---|:-:|:-:|
| Multi-connection acceleration | Yes | No |
| Dynamic segment splitting | Yes | No |
| Crash-safe pause / resume | Yes | Partial |
| Queues, scheduler, speed limits | Yes | No |
| CLI + headless daemon + API | Yes | No |
| Windows / macOS / Linux | Yes | Yes |
| Open source, no telemetry, no ads | Yes | n/a |

## Features (planned)

- **Speed:** up to 32 parallel connections per file, work stealing so connections never sit idle, adaptive connection tuning, HTTP/2 (HTTP/3 later), multi-mirror downloads.
- **Reliability:** pause or resume any time, survives crashes and reboots, auto-retry with backoff, refresh expired links without losing progress.
- **Browser integration:** Chrome, Edge, Brave, Firefox and more. Captures downloads with cookies and headers so logged-in downloads work.
- **Organization:** queues, scheduler, categories, speed limits, post-download actions.
- **Media:** HLS/DASH stream downloads (non-DRM).
- **For power users:** `loeun` CLI, `loeund` daemon, JSON-RPC API.

See the full [Product Requirements](docs/PRD.md) and [Roadmap](docs/ROADMAP.md).

## Tech

Rust (tokio) engine · Tauri 2 desktop shell · React + TypeScript UI · Manifest V3 browser extension · SQLite state. See [Architecture](docs/ARCHITECTURE.md) and [Tech Stack](docs/TECH_STACK.md).

## Documentation

| Doc | Description |
|---|---|
| [PRD](docs/PRD.md) | What we're building and why |
| [Architecture](docs/ARCHITECTURE.md) | Components, layout, security model |
| [Engine Design](docs/ENGINE_DESIGN.md) | Segmentation, resume, durability internals |
| [Browser Integration](docs/BROWSER_INTEGRATION.md) | Extension + native messaging |
| [Roadmap](docs/ROADMAP.md) · [Backlog](docs/BACKLOG.md) | Milestones and task breakdown |
| [ADRs](docs/adr/) | Architecture decision records |
| [Testing](docs/TESTING.md) · [Release](docs/RELEASE.md) | Engineering process |
| [Brand](docs/BRAND.md) | Logo, colours, asset usage |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately, as described in [SECURITY.md](SECURITY.md).

## License

Licensed under either of

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT license ([LICENSE-MIT](LICENSE-MIT))

at your option.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
