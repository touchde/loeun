//! Message types exchanged with the browser extension.
//! See `docs/BROWSER_INTEGRATION.md` §4.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

/// Protocol version spoken by this host.
pub(crate) const PROTOCOL_VERSION: u32 = 1;

/// A message from the extension.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct Request {
    /// Protocol version the extension speaks.
    pub(crate) v: u32,
    /// Correlation id, echoed back in the response.
    pub(crate) id: String,
    /// Message type, e.g. `hello`.
    #[serde(rename = "type")]
    pub(crate) kind: String,
    /// Type-specific data.
    #[serde(default)]
    #[allow(dead_code)] // Used once `add` and friends are implemented (M3-01).
    pub(crate) payload: Value,
}

/// A reply to the extension. Always has `type: "result"`.
#[derive(Debug, Serialize, PartialEq)]
pub(crate) struct Response {
    pub(crate) v: u32,
    /// The request id this answers; `null` when the request couldn't be parsed.
    pub(crate) id: Option<String>,
    #[serde(rename = "type")]
    pub(crate) kind: &'static str,
    pub(crate) ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) payload: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) error: Option<String>,
}

impl Response {
    fn ok(id: String, payload: Value) -> Self {
        Self {
            v: PROTOCOL_VERSION,
            id: Some(id),
            kind: "result",
            ok: true,
            payload: Some(payload),
            error: None,
        }
    }

    pub(crate) fn error(id: Option<String>, message: impl Into<String>) -> Self {
        Self {
            v: PROTOCOL_VERSION,
            id,
            kind: "result",
            ok: false,
            payload: None,
            error: Some(message.into()),
        }
    }
}

/// Parses one raw message and produces the reply.
pub(crate) fn handle(raw: &[u8]) -> Response {
    let request: Request = match serde_json::from_slice(raw) {
        Ok(r) => r,
        Err(e) => return Response::error(None, format!("invalid message: {e}")),
    };

    if request.v != PROTOCOL_VERSION {
        return Response::error(
            Some(request.id),
            format!(
                "unsupported protocol version {} (host speaks {PROTOCOL_VERSION})",
                request.v
            ),
        );
    }

    match request.kind.as_str() {
        "hello" => Response::ok(
            request.id,
            json!({
                "app": "loeun",
                "version": loeun_core::version(),
                "protocol": PROTOCOL_VERSION,
                "capabilities": [],
            }),
        ),
        other => Response::error(
            Some(request.id),
            format!("unsupported message type `{other}`"),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hello_returns_version_and_echoes_id() {
        let res = handle(br#"{"v":1,"id":"abc","type":"hello","payload":{}}"#);
        assert!(res.ok);
        assert_eq!(res.id.as_deref(), Some("abc"));
        let payload = res.payload.unwrap();
        assert_eq!(payload["version"], loeun_core::version());
        assert_eq!(payload["protocol"], PROTOCOL_VERSION);
    }

    #[test]
    fn payload_is_optional() {
        assert!(handle(br#"{"v":1,"id":"x","type":"hello"}"#).ok);
    }

    #[test]
    fn unknown_type_is_an_error() {
        let res = handle(br#"{"v":1,"id":"x","type":"format_disk"}"#);
        assert!(!res.ok);
        assert_eq!(res.id.as_deref(), Some("x"));
        assert!(res.error.unwrap().contains("format_disk"));
    }

    #[test]
    fn unknown_fields_are_rejected() {
        let res = handle(br#"{"v":1,"id":"x","type":"hello","extra":true}"#);
        assert!(!res.ok);
        assert!(res.id.is_none());
    }

    #[test]
    fn invalid_json_is_an_error() {
        let res = handle(b"not json");
        assert!(!res.ok);
        assert!(res.error.unwrap().starts_with("invalid message"));
    }

    #[test]
    fn wrong_protocol_version_is_an_error() {
        let res = handle(br#"{"v":99,"id":"x","type":"hello"}"#);
        assert!(!res.ok);
        assert!(res.error.unwrap().contains("99"));
    }

    #[test]
    fn response_serializes_to_expected_shape() {
        let json = serde_json::to_value(Response::error(Some("x".into()), "nope")).unwrap();
        assert_eq!(
            json,
            json!({"v":1,"id":"x","type":"result","ok":false,"error":"nope"})
        );
    }
}
