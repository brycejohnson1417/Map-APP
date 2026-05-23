## 2024-05-24 - [Fix XSS vulnerability in email preview using sandboxed iframe]
**Vulnerability:** XSS vulnerability through the use of `dangerouslySetInnerHTML` to render email previews.
**Learning:** Using `dangerouslySetInnerHTML` with `DOMPurify` is less secure than using a sandboxed `iframe` with `srcDoc` and `sandbox=""`. An `iframe` provides an isolated browsing context that prevents script execution and limits the impact of XSS.
**Prevention:** Avoid `dangerouslySetInnerHTML` for untrusted or dynamic HTML content, especially email previews. Prioritize a sandboxed `iframe` to provide a stronger security boundary.
