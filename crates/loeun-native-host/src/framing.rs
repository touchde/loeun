//! Native messaging wire format: a 32-bit message length in native byte order,
//! followed by that many bytes of UTF-8 JSON.
//!
//! See <https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging#native-messaging-host-protocol>.

use std::io::{self, Read, Write};

/// Largest message we accept from the browser. Real messages (a URL plus
/// cookies and headers) are a few KiB; anything bigger is rejected rather
/// than buffered.
pub(crate) const MAX_INCOMING: u32 = 1024 * 1024;

/// Largest message Chrome accepts from a native host.
pub(crate) const MAX_OUTGOING: usize = 1024 * 1024;

/// Errors while reading or writing a framed message.
#[derive(Debug, thiserror::Error)]
pub(crate) enum FrameError {
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),
    #[error("message of {0} bytes exceeds the {MAX_INCOMING}-byte limit")]
    TooLarge(u64),
    #[error("message length prefix is truncated")]
    TruncatedHeader,
}

/// Reads one framed message. Returns `Ok(None)` on a clean end of input
/// (the browser closed the port).
pub(crate) fn read_message(reader: &mut impl Read) -> Result<Option<Vec<u8>>, FrameError> {
    let mut header = [0u8; 4];
    let mut filled = 0;
    while filled < header.len() {
        match reader.read(&mut header[filled..])? {
            0 if filled == 0 => return Ok(None),
            0 => return Err(FrameError::TruncatedHeader),
            n => filled += n,
        }
    }

    let len = u32::from_ne_bytes(header);
    if len > MAX_INCOMING {
        return Err(FrameError::TooLarge(u64::from(len)));
    }

    let mut body = vec![0u8; len as usize];
    reader.read_exact(&mut body)?;
    Ok(Some(body))
}

/// Writes one framed message and flushes it.
pub(crate) fn write_message(writer: &mut impl Write, body: &[u8]) -> Result<(), FrameError> {
    if body.len() > MAX_OUTGOING {
        return Err(FrameError::TooLarge(body.len() as u64));
    }
    let len = u32::try_from(body.len()).map_err(|_| FrameError::TooLarge(body.len() as u64))?;
    writer.write_all(&len.to_ne_bytes())?;
    writer.write_all(body)?;
    writer.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn frame(body: &[u8]) -> Vec<u8> {
        let mut out = Vec::new();
        write_message(&mut out, body).unwrap();
        out
    }

    #[test]
    fn round_trips_a_message() {
        let bytes = frame(br#"{"type":"hello"}"#);
        let mut cursor = Cursor::new(bytes);
        let body = read_message(&mut cursor).unwrap().unwrap();
        assert_eq!(body, br#"{"type":"hello"}"#);
        assert!(read_message(&mut cursor).unwrap().is_none());
    }

    #[test]
    fn length_prefix_is_native_endian() {
        let bytes = frame(b"abc");
        assert_eq!(&bytes[..4], &3u32.to_ne_bytes());
        assert_eq!(&bytes[4..], b"abc");
    }

    #[test]
    fn reads_several_messages_in_sequence() {
        let mut bytes = frame(b"one");
        bytes.extend(frame(b"two"));
        let mut cursor = Cursor::new(bytes);
        assert_eq!(read_message(&mut cursor).unwrap().unwrap(), b"one");
        assert_eq!(read_message(&mut cursor).unwrap().unwrap(), b"two");
        assert!(read_message(&mut cursor).unwrap().is_none());
    }

    #[test]
    fn empty_input_is_clean_eof() {
        assert!(
            read_message(&mut Cursor::new(Vec::new()))
                .unwrap()
                .is_none()
        );
    }

    #[test]
    fn truncated_header_is_an_error() {
        let err = read_message(&mut Cursor::new(vec![1u8, 0])).unwrap_err();
        assert!(matches!(err, FrameError::TruncatedHeader));
    }

    #[test]
    fn truncated_body_is_an_error() {
        let mut bytes = 10u32.to_ne_bytes().to_vec();
        bytes.extend(b"short");
        let err = read_message(&mut Cursor::new(bytes)).unwrap_err();
        assert!(matches!(err, FrameError::Io(e) if e.kind() == io::ErrorKind::UnexpectedEof));
    }

    #[test]
    fn oversized_message_is_rejected_without_reading_body() {
        let bytes = (MAX_INCOMING + 1).to_ne_bytes().to_vec();
        let err = read_message(&mut Cursor::new(bytes)).unwrap_err();
        assert!(matches!(err, FrameError::TooLarge(_)));
    }

    #[test]
    fn oversized_outgoing_message_is_rejected() {
        let big = vec![b'x'; MAX_OUTGOING + 1];
        let err = write_message(&mut Vec::new(), &big).unwrap_err();
        assert!(matches!(err, FrameError::TooLarge(_)));
    }
}
