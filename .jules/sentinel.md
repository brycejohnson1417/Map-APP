## 2025-05-18 - XSS Risk in Email Preview
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML` even with DOMPurify.
**Learning:** `dangerouslySetInnerHTML` can still pose risks with complex payloads. A sandboxed `iframe` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` provides better defense-in-depth for untrusted HTML like email previews.
**Prevention:** Always use sandboxed iframes for untrusted HTML rendering instead of `dangerouslySetInnerHTML`.
