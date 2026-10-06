## 2025-01-30 - Prevent XSS in Email Previews with Sandboxed Iframes
**Vulnerability:** Use of `dangerouslySetInnerHTML` for rendering email HTML, even when sanitized by `DOMPurify`, can present residual XSS risks.
**Learning:** Using a sandboxed `iframe` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` eliminates script execution and same-origin access risks, providing defense in depth. However, styles must be manually injected via `<style>` tag within the `srcDoc` to preserve visual formatting because Tailwind classes on the `iframe` do not affect inner elements.
**Prevention:** Default to using sandboxed `iframes` for displaying any complex, untrusted, or dynamic HTML rather than relying solely on sanitization libraries.
