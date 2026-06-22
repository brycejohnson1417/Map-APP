## 2026-06-22 - Prevent XSS with srcDoc iframe
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML` rendering sanitized email HTML in `PppSavingsPanel`.
**Learning:** Even with DOMPurify, rendering untrusted or third-party HTML via `dangerouslySetInnerHTML` leaves a small attack surface. Wrapping it in a sandboxed iframe using the `srcDoc` attribute provides a much stronger isolated browsing context, eliminating script execution and style bleed without requiring complex setup.
**Prevention:** Prefer sandboxed iframes (`sandbox="allow-popups allow-popups-to-escape-sandbox"`) with `srcDoc` when rendering email previews or dynamic HTML content, over React's `dangerouslySetInnerHTML`.
