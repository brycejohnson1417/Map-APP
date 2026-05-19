
## 2026-05-19 - XSS Defense-in-Depth for Dynamic HTML Rendering
**Vulnerability:** Untrusted dynamic HTML (email previews) was being rendered using `dangerouslySetInnerHTML`. Even with `DOMPurify`, this is inherently risky as mutations or bypasses could allow script execution in the main context.
**Learning:** `dangerouslySetInnerHTML` should not be used for rendering complete documents like emails, as it lacks strong isolation boundaries. A sandboxed `<iframe>` provides a true defense-in-depth approach by isolating the context entirely.
**Prevention:** For XSS prevention when rendering dynamic or untrusted HTML (e.g., email previews), prioritize using a sandboxed `<iframe>` with the `srcDoc` attribute and a strict `sandbox=""` attribute. This provides a stronger security boundary than `dangerouslySetInnerHTML`, even when used with sanitizers.
