//! `loeun-native-host` — native messaging host for the Loeun browser extension.
//!
//! The browser starts this binary and talks to it over stdin/stdout. For now it
//! answers the `hello` handshake; relaying downloads to the desktop app arrives
//! with M3-01 and M3-02. See `docs/BROWSER_INTEGRATION.md`.
//!
//! stdout carries protocol frames only, so diagnostics go to stderr, which the
//! browser writes to its own log.

#![allow(clippy::print_stderr)]

mod framing;
mod protocol;

use std::io::{self, BufReader, BufWriter};
use std::process::ExitCode;

use framing::{FrameError, read_message, write_message};

fn run() -> Result<(), FrameError> {
    let mut input = BufReader::new(io::stdin().lock());
    let mut output = BufWriter::new(io::stdout().lock());

    while let Some(raw) = read_message(&mut input)? {
        let response = protocol::handle(&raw);
        let body = serde_json::to_vec(&response).map_err(io::Error::other)?;
        write_message(&mut output, &body)?;
    }
    Ok(())
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("loeun-native-host: {e}");
            ExitCode::FAILURE
        }
    }
}
