## 2024-05-24 - Avoid dangerouslySetInnerHTML for email previews
**Vulnerability:** Potential XSS via `dangerouslySetInnerHTML` in email previews, even when using `DOMPurify`.
**Learning:** For rendering dynamic or untrusted HTML like email previews, `dangerouslySetInnerHTML` can still pose risks depending on `DOMPurify` configuration and context. A safer approach provides an isolated browsing context.
**Prevention:** Use a sandboxed `<iframe>` with the `srcDoc` attribute. Set `sandbox="allow-popups allow-popups-to-escape-sandbox"` to allow links to open while strictly preventing script execution (`allow-scripts`) and same-origin access (`allow-same-origin`).
