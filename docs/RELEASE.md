# Release Process

## Versioning
- [Semantic Versioning](https://semver.org). Pre-1.0: minor = features, patch = fixes.
- One version for the app, CLI and core crates, kept in sync in `Cargo.toml` (workspace), `apps/desktop/package.json` and `apps/desktop/src-tauri/tauri.conf.json`.
- The browser extension is versioned independently.

## Commit convention
[Conventional Commits](https://www.conventionalcommits.org). PR titles are linted in CI (`.github/workflows/pr-title.yml`), and squash-merge uses the PR title, so `main` history is clean and drives the changelog via `git-cliff`.

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `revert`. Scopes: `core`, `cli`, `desktop`, `ext`, `host`, `daemon`, `docs`, `ci`.

## Cutting a release
1. Make sure `main` is green.
2. Bump versions: `cargo set-version X.Y.Z` (cargo-edit) and update `package.json` / `tauri.conf.json` (a script `scripts/bump-version` will be added in M0).
3. Commit `chore(release): vX.Y.Z`, then tag `vX.Y.Z` and push the tag.
4. `.github/workflows/release.yml`:
   - builds the desktop app for macOS (arm64, x64), Windows (x64, arm64) and Linux (x64, arm64)
   - builds CLI binaries for the same targets
   - signs artifacts when signing secrets are present
   - generates release notes with git-cliff
   - creates a **draft** GitHub Release with all artifacts, checksums (`SHA256SUMS`) and the updater manifest (`latest.json`)
5. A maintainer reviews the draft, smoke-tests the installers, then publishes.
6. Tags with a pre-release suffix (`v0.2.0-beta.1`) are published as pre-releases and go to the beta update channel.

## Required repository secrets

| Secret | Used for | Needed from |
|---|---|---|
| `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Updater signatures | M2 |
| `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY` | macOS code signing | M5 |
| `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | Notarization | M5 |
| `AZURE_*` or SignPath tokens | Windows code signing | M5 |
| `CHROME_*`, `AMO_*` | Extension store publishing | M3 |

Generate the updater key with `pnpm tauri signer generate`. **Never commit private keys.**
