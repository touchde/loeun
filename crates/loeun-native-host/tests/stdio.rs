//! Runs the real binary over stdin/stdout, the way a browser does.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use assert_cmd::Command;
use serde_json::{Value, json};

fn frame(msg: &Value) -> Vec<u8> {
    let body = serde_json::to_vec(msg).unwrap();
    let mut out = u32::try_from(body.len()).unwrap().to_ne_bytes().to_vec();
    out.extend(body);
    out
}

fn unframe_all(mut bytes: &[u8]) -> Vec<Value> {
    let mut out = Vec::new();
    while !bytes.is_empty() {
        let len = u32::from_ne_bytes(bytes[..4].try_into().unwrap()) as usize;
        out.push(serde_json::from_slice(&bytes[4..4 + len]).unwrap());
        bytes = &bytes[4 + len..];
    }
    out
}

fn host() -> Command {
    Command::cargo_bin("loeun-native-host").expect("binary should be built")
}

#[test]
fn answers_hello_and_exits_cleanly_on_eof() {
    let mut input = frame(&json!({"v": 1, "id": "1", "type": "hello"}));
    input.extend(frame(&json!({"v": 1, "id": "2", "type": "nope"})));

    let output = host()
        .write_stdin(input)
        .assert()
        .success()
        .get_output()
        .clone();
    let replies = unframe_all(&output.stdout);

    assert_eq!(replies.len(), 2);
    assert_eq!(replies[0]["id"], "1");
    assert_eq!(replies[0]["ok"], true);
    assert_eq!(replies[0]["payload"]["app"], "loeun");
    assert_eq!(replies[1]["id"], "2");
    assert_eq!(replies[1]["ok"], false);
}

#[test]
fn exits_with_error_on_oversized_message() {
    let input = (2u32 * 1024 * 1024).to_ne_bytes().to_vec();
    host()
        .write_stdin(input)
        .assert()
        .failure()
        .stderr(predicates::str::contains("exceeds"));
}
