## 2024-05-20 - Sandboxed Iframes for Email Previews
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML` in email previews, even with DOMPurify.
**Learning:** To prevent XSS when rendering dynamic or untrusted HTML like emails, `dangerouslySetInnerHTML` is insufficient. An `iframe` with `srcDoc` and restrictive `sandbox` creates an isolated context.
**Prevention:** Use `<iframe srcDoc={...} sandbox="allow-popups allow-popups-to-escape-sandbox" />` instead of `dangerouslySetInnerHTML` for third-party or complex dynamic HTML.