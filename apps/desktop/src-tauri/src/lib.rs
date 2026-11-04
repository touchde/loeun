//! Loeun desktop app: the Rust side of the Tauri shell.
//!
//! Owns the engine and exposes it to the webview through Tauri commands.
//! For now it only reports the engine version (backlog task M0-04); the real
//! engine wiring arrives with M2-01.

// Startup failures have no UI to report to yet, so they go to stderr.
#![allow(clippy::print_stderr)]

/// Returns the version of the embedded download engine.
#[tauri::command]
fn engine_version() -> &'static str {
    loeun_core::version()
}

/// Builds and runs the Tauri application. Blocks until the app exits.
pub fn run() {
    let result = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![engine_version])
        .run(tauri::generate_context!());

    if let Err(e) = result {
        eprintln!("loeun: failed to start the desktop app: {e}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn engine_version_comes_from_core() {
        assert_eq!(engine_version(), loeun_core::version());
    }
}
