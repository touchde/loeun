# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| Latest release | Yes |
| Older releases | No (please upgrade) |

Before 1.0, only the latest minor release gets fixes.

## Reporting a vulnerability

**Please do not open public issues for security problems.**

Report privately through [GitHub Security Advisories](../../security/advisories/new) ("Report a vulnerability"). Include:
- affected component (core, desktop, extension, native host, daemon)
- version / commit and OS
- reproduction steps or proof of concept
- impact as you understand it

What to expect:
- Acknowledgement within **3 business days**
- An initial assessment within **7 days**
- A fix or mitigation plan, coordinated disclosure, and credit in the advisory (unless you prefer to stay anonymous)

## Scope highlights
High-interest areas: native messaging host input handling, local IPC/RPC authentication, filename and path sanitization (path traversal), the update signature check, and the Tauri command surface exposed to the webview.
