# ADR-0001: Rust for the core download engine

- **Status:** Accepted
- **Date:** 2026-11-03

## Context
The engine must handle hundreds of concurrent connections, positional disk I/O and crash-safe persistence. It needs a small memory footprint and must run on Windows, macOS and Linux (x86_64 + aarch64), and possibly mobile later. It should be reusable from the desktop app, a CLI and a headless daemon.

## Options
1. **Rust (tokio):** zero-cost async, no GC, strong cross-compile story, memory safety. Steeper learning curve.
2. **Go:** goroutines suit I/O work well, simple, fast builds. GC pauses are minor here. Pairs with Wails or Flutter.
3. **C++ (+ libcurl / aria2):** maximum control and a proven engine (aria2), but memory-safety risk and harder contributions.
4. **Wrap aria2:** fastest path, but we can't implement our own dynamic splitting, persistence model or UX freely. Also adds an external process.

## Decision
Write the engine in **Rust** as a standalone library crate (`loeun-core`). Front-ends (Tauri app, CLI, daemon) embed it in-process.

## Consequences

**Positive**
- Same language as the Tauri backend, so there's no FFI boundary.
- Predictable performance and low memory use; safe concurrency.
- One crate serves the desktop app, CLI, daemon and tests.

**Negative**
- Fewer casual contributors than Go or JS. We reduce this with good docs, `good first issue` labels and a clean module layout.
- Longer compile times. We reduce this with `rust-cache` in CI and workspace feature flags.
