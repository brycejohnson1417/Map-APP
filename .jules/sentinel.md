## 2024-10-09 - Fix XSS Vulnerability in Email Preview
**Vulnerability:** The email preview used `dangerouslySetInnerHTML` even though it was sanitized by `DOMPurify`.
**Learning:** To prevent XSS when rendering dynamic or untrusted HTML (like email previews), prioritize using a sandboxed `<iframe>` with the `srcDoc` attribute instead of `dangerouslySetInnerHTML`, even when used with `DOMPurify`.
**Prevention:** Always use sandboxed iframes (`sandbox="allow-popups allow-popups-to-escape-sandbox"`) when rendering user-generated or external HTML, and manually inject styles into the `srcDoc` string to match the application's look and feel.
