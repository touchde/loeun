# loeun-native-host

Native messaging host that connects the Loeun browser extension to the desktop app. The browser launches it and exchanges length-prefixed JSON messages over stdin/stdout.

Currently it answers the `hello` handshake only. Relaying downloads to the app arrives with backlog tasks M3-01 and M3-02. Protocol details are in [docs/BROWSER_INTEGRATION.md](../../docs/BROWSER_INTEGRATION.md).

## License

Licensed under either of [Apache License, Version 2.0](../../LICENSE-APACHE) or [MIT license](../../LICENSE-MIT) at your option.
