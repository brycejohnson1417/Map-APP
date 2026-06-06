## 2026-06-06 - [Sandboxed Iframe for Email Previews]
**Vulnerability:** XSS risk from using `dangerouslySetInnerHTML` to render user-provided HTML, even with `DOMPurify`.
**Learning:** Using an `iframe` with `srcDoc` and `sandbox` attributes provides defense-in-depth isolation against XSS when rendering dynamic HTML.
**Prevention:** Prioritize using a sandboxed `iframe` over `dangerouslySetInnerHTML`. For email previews, use `sandbox="allow-popups allow-popups-to-escape-sandbox"` to permit link clicking while omitting `allow-scripts` and `allow-same-origin`.
