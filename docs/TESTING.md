# Testing Strategy

| Layer | Tooling | Runs |
|---|---|---|
| Rust unit tests | `cargo nextest` | Every PR, all 3 OSes |
| Rust property tests (planner, splitter, rate limiter, filename sanitizer) | `proptest` | Every PR |
| Engine integration (fault-injection HTTP server) | `axum` test server in `tests/e2e` | Every PR |
| Crash/kill-9 fuzz | CLI + random `SIGKILL` + SHA-256 compare | PR (short), nightly (long) |
| UI unit/component | Vitest + Testing Library | Every PR |
| Extension unit | Vitest + mocked `chrome.*` | Every PR |
| Desktop E2E | WebdriverIO + `tauri-driver` (Linux/Windows) | Nightly (from M2) |
| Benchmarks | `criterion` + throughput harness | Nightly, results published |

## Fault-injection server scenarios
- No `Accept-Ranges` / ignores `Range` (returns 200)
- Per-connection throttling (simulates servers that cap speed per connection)
- Random connection resets mid-stream
- `429` / `503` with `Retry-After`
- ETag changes between requests
- Redirect chains, relative redirects, cross-host redirects
- Chunked transfer with unknown length
- Slow first byte, stalled connections (read timeout)
- `Content-Disposition` variants (RFC 5987 `filename*`, quotes, unicode)

## Coverage
Aim for ≥ 80% line coverage on `loeun-core` (tracked with `cargo-llvm-cov`). The UI isn't held to a coverage target, but critical flows need tests.
