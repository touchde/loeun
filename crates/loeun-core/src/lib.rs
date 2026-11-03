//! # loeun-core
//!
//! The download engine behind [Loeun](https://github.com/touchde/loeun): segmented,
//! resumable, multi-connection downloads.
//!
//! This crate has no UI dependencies. The desktop app, the `loeun` CLI and the
//! daemon are thin front-ends on top of it. See `docs/ARCHITECTURE.md` and
//! `docs/ENGINE_DESIGN.md` in the repository for the design.
//!
//! The engine is under active development; the public API is not stable yet.

/// The version of this crate, as declared in `Cargo.toml`.
///
/// # Examples
///
/// ```
/// let v = loeun_core::version();
/// assert!(!v.is_empty());
/// ```
pub const fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_matches_cargo_manifest() {
        assert_eq!(version(), env!("CARGO_PKG_VERSION"));
    }

    #[test]
    fn version_is_semver_like() {
        let parts: Vec<&str> = version().split('.').collect();
        assert_eq!(
            parts.len(),
            3,
            "expected MAJOR.MINOR.PATCH, got {}",
            version()
        );
        assert!(parts.iter().all(|p| p.parse::<u64>().is_ok()));
    }
}
