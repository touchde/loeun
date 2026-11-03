# ADR-0002: Tauri 2 + React for the desktop UI

- **Status:** Accepted
- **Date:** 2026-11-03

## Context
We need a cross-platform desktop UI with a small installer (< 15 MB), low idle memory, a system tray, notifications, auto-update and deep links. A Rust backend is already chosen ([ADR-0001](0001-rust-core-engine.md)).

## Options
| Option | Size | Pros | Cons |
|---|---|---|---|
| **Tauri 2** | ~5–15 MB | Rust-native, OS webview, rich plugins, capability-based security | Webview differences (WebKitGTK on Linux) |
| Electron | 100+ MB | Consistent Chromium, huge ecosystem | Heavy RAM and disk; JS backend → FFI to Rust |
| Flutter | ~20–40 MB | Consistent rendering | Dart ↔ Rust FFI bridge, weaker desktop tray/integration |
| Slint / egui / Iced | small | Pure Rust | Less mature for polished, accessible, themable apps |
| Qt | medium | Native feel | C++/licensing complexity |

UI framework within Tauri: **React** (largest ecosystem, most contributors) vs Svelte (smaller and faster). The UI is a list, dialogs and a chart, so either works well.

## Decision
**Tauri 2** with **React 18 + TypeScript + Vite**, Tailwind CSS and Radix UI primitives.

## Consequences

**Positive**
- Meets the size and memory targets; direct in-process access to `loeun-core`.
- Most contributors already know React.

**Negative**
- We must test on WebKitGTK and WKWebView and avoid bleeding-edge web APIs.
- Long lists (thousands of downloads) need virtualization (`@tanstack/react-virtual`).
