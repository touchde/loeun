# ADR-0004: Dual license MIT OR Apache-2.0

- **Status:** Accepted
- **Date:** 2026-11-03

## Context
We want the widest adoption, easy reuse of `loeun-core` by other projects, and compatibility with the Rust ecosystem.

## Options
- **MIT OR Apache-2.0:** the Rust ecosystem norm; Apache adds an explicit patent grant.
- **GPL-3.0:** forces forks to stay open, but discourages library reuse and some distributors.
- **MPL-2.0:** file-level copyleft; a middle ground.

## Decision
Dual-license under **MIT OR Apache-2.0**. Contributions are accepted under the same terms (inbound = outbound), with no CLA.

## Consequences

**Positive**
- Maximum compatibility; the crates can be published to crates.io with no friction.

**Negative**
- Closed-source forks are allowed. We accept this tradeoff for adoption.

- All dependencies must use compatible licenses, enforced by `cargo-deny` (`deny.toml`).
