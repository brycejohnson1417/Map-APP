## 2024-10-01 - [Sandboxing Email Previews]
**Vulnerability:** XSS risk from rendering untrusted HTML via `dangerouslySetInnerHTML`, even with DOMPurify.
**Learning:** Using a sandboxed `<iframe>` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` provides a stronger, isolated browsing context that prevents script execution while preserving safe link functionality.
**Prevention:** Prioritize sandboxed iframes for rendering dynamic HTML like email previews, and manually inject necessary CSS into the `srcDoc`.