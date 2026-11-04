//! Build script for the desktop app.

// A build script may fail loudly; there is no caller to return an error to.
#![allow(clippy::expect_used)]

fn main() {
    // `tauri::generate_context!` embeds the built frontend from `../dist` and
    // fails to compile if that folder is missing. Creating it (empty) lets
    // `cargo check`, `clippy` and `test` run on the workspace without building
    // the frontend first. Real builds go through `pnpm tauri build`, which runs
    // `pnpm build` and fills it.
    let dist = std::path::Path::new("../dist");
    if !dist.exists() {
        std::fs::create_dir_all(dist).expect("failed to create ../dist placeholder");
    }
    tauri_build::build();
}
