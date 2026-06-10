## 2024-06-10 - Replace dangerouslySetInnerHTML with sandboxed iframe
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML` when rendering email previews, even with DOMPurify.
**Learning:** For untrusted HTML, defense in depth requires an isolated browsing context.
**Prevention:** Always use a sandboxed `<iframe>` with `srcDoc` and restrictive `sandbox` attributes for untrusted HTML rendering.
