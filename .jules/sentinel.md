## 2024-05-24 - [Replace dangerouslySetInnerHTML with Sandboxed iframe]
**Vulnerability:** Used `dangerouslySetInnerHTML` to render dynamic email previews in React component `ppp-savings-panel.tsx`.
**Learning:** Even with DOMPurify, `dangerouslySetInnerHTML` carries inherent XSS risks when rendering untrusted or dynamic HTML. Sandboxed `iframe` with `srcDoc` and `sandbox=""` provides a stronger, native security boundary.
**Prevention:** Prioritize using a sandboxed `iframe` over `dangerouslySetInnerHTML` for rendering untrusted dynamic HTML, especially for complete document previews like emails.
