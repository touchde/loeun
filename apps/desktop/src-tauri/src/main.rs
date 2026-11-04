//! Loeun desktop app entry point.

// Don't open a console window next to the app on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    loeun_desktop_lib::run();
}
