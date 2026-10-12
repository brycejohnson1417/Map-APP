## 2024-05-24 - [Fix XSS vulnerability in email preview]
**Vulnerability:** XSS vulnerability via dangerouslySetInnerHTML in PPP savings email preview
**Learning:** Even though DOMPurify was used to sanitize the HTML, using `dangerouslySetInnerHTML` directly in the DOM is still a security risk, especially when displaying entire HTML documents (like email bodies). It's safer to isolate potentially untrusted HTML in a sandboxed `iframe`.
**Prevention:** Use sandboxed `iframe` with `srcDoc` attribute to render untrusted HTML instead of `dangerouslySetInnerHTML` to ensure CSS and JS are fully isolated.
