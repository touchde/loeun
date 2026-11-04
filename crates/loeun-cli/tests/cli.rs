//! End-to-end tests for the `loeun` binary.

// Test helpers may panic; clippy's in-test exemption only covers `#[test]` fns.
#![allow(clippy::expect_used)]

use assert_cmd::Command;
use predicates::prelude::*;

fn loeun() -> Command {
    Command::cargo_bin("loeun").expect("binary `loeun` should be built")
}

#[test]
fn version_prints_workspace_version() {
    loeun()
        .arg("--version")
        .assert()
        .success()
        .stdout(format!("loeun {}\n", env!("CARGO_PKG_VERSION")));
}

#[test]
fn help_lists_get_command() {
    loeun()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("get").and(predicate::str::contains("Download a file")));
}

#[test]
fn no_arguments_shows_usage_and_fails() {
    loeun()
        .assert()
        .failure()
        .stderr(predicate::str::contains("Usage: loeun"));
}

#[test]
fn get_reports_not_implemented() {
    loeun()
        .args(["get", "https://example.com/file.zip"])
        .assert()
        .code(2)
        .stderr(
            predicate::str::contains("not implemented")
                .and(predicate::str::contains("https://example.com/file.zip")),
        );
}

#[test]
fn get_requires_url() {
    loeun()
        .arg("get")
        .assert()
        .failure()
        .stderr(predicate::str::contains("<URL>"));
}
