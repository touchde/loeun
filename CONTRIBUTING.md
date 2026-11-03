# Contributing to Loeun

Thanks for your interest! This guide explains how to set up, propose changes and get them merged.

## Ways to contribute
- Report bugs with the bug template
- Propose features with the feature template. Large features go to an RFC discussion first.
- Improve docs and translations
- Add tests, especially fault-injection scenarios
- Pick an issue labeled [`good first issue`](../../labels/good%20first%20issue) or [`help wanted`](../../labels/help%20wanted)

Comment on an issue before starting so work isn't duplicated.

## Development setup

**Prerequisites**
- Rust stable (`rustup`; the toolchain is pinned in `rust-toolchain.toml`)
- Node.js LTS (see `.nvmrc`) + pnpm (`corepack enable`)
- Tauri system dependencies: <https://v2.tauri.app/start/prerequisites/>
  - Linux: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential`

**Common commands** (available once the workspace is scaffolded in M0)
```bash
pnpm install                 # JS deps
cargo build                  # Rust workspace
cargo nextest run            # Rust tests
pnpm --filter desktop tauri dev   # run the desktop app
pnpm --filter extension dev       # build extension in watch mode
pnpm lint && cargo clippy --all-targets -- -D warnings
```

## Workflow
1. Fork, then create a branch: `feat/core-dynamic-split`, `fix/ext-cookie-partition`, ...
2. Make focused changes with tests.
3. Make sure these pass locally: `cargo fmt --all`, `cargo clippy --all-targets -- -D warnings`, `cargo nextest run`, `pnpm lint`, `pnpm test`.
4. Open a PR. **The PR title must follow [Conventional Commits](https://www.conventionalcommits.org)**, e.g. `feat(core): dynamic segment splitting`. PRs are squash-merged using the title.
5. Fill in the PR template. Link issues with `Closes #123`.

## Coding guidelines
- **Rust:** `rustfmt` defaults; no `unwrap()`/`expect()` in library code outside tests; public items documented; errors via `thiserror`.
- **TypeScript:** `strict` mode, Biome for lint and format, no `any` without justification.
- **Commits inside a PR** can be anything. The squashed title is what counts.
- **Big changes** (new protocol, storage change, public API) need an ADR in `docs/adr/`.
- **Dependencies:** must pass `cargo deny check`. Prefer well-maintained crates and justify new ones in the PR.

## DCO / licensing
By contributing you agree that your contributions are licensed under **MIT OR Apache-2.0**. No CLA is required.

## Code of Conduct
This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
