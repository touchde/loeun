//! `loeun` — command-line interface for the Loeun download manager.
//!
//! This is a stub (backlog task M0-02). Real downloading arrives with M1-20.

// A CLI's job is to write to the terminal.
#![allow(clippy::print_stdout, clippy::print_stderr)]

use std::process::ExitCode;

use clap::{Parser, Subcommand};

/// Exit code for commands that exist but are not implemented yet.
const EXIT_NOT_IMPLEMENTED: u8 = 2;

/// Fast, resumable, multi-connection downloads.
#[derive(Debug, Parser)]
#[command(name = "loeun", version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Download a file.
    Get {
        /// URL to download.
        url: String,
    },
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match cli.command {
        Command::Get { url } => {
            eprintln!(
                "loeun get: not implemented yet (engine {})",
                loeun_core::version()
            );
            eprintln!("  url: {url}");
            ExitCode::from(EXIT_NOT_IMPLEMENTED)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn cli_definition_is_valid() {
        Cli::command().debug_assert();
    }
}
