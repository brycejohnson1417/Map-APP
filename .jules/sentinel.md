## 2026-07-08 - XSS Prevention via Sandboxed iframes
**Vulnerability:** Used dangerouslySetInnerHTML for email preview rendering, presenting an XSS risk even when used with DOMPurify.
**Learning:** To prevent XSS when rendering dynamic or untrusted HTML like email previews, an isolated browsing context is safer.
**Prevention:** Prioritize using a sandboxed <iframe> with the srcDoc attribute instead of dangerouslySetInnerHTML. Use sandbox='allow-popups allow-popups-to-escape-sandbox' to permit link clicking while omitting allow-scripts.
