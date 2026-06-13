## 2024-06-13 - [Defense-in-depth: XSS Prevention in Email Previews]
**Vulnerability:** Email preview dynamic HTML was being rendered using `dangerouslySetInnerHTML`.
**Learning:** Even when used alongside `DOMPurify`, rendering untrusted HTML (like email content) with `dangerouslySetInnerHTML` carries inherent XSS risks.
**Prevention:** To prevent XSS when rendering dynamic or untrusted HTML, prioritize using a sandboxed `<iframe>` with the `srcDoc` attribute instead. Use `sandbox="allow-popups allow-popups-to-escape-sandbox"` to permit clicking legitimate links without enabling scripts or exposing the parent browsing context.
