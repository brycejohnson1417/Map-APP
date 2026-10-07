## 2024-10-07 - Use Sandboxed Iframes over dangerouslySetInnerHTML for email previews
**Vulnerability:** XSS risk due to rendering dynamic email templates using `dangerouslySetInnerHTML`, even with DOMPurify.
**Learning:** DOMPurify provides baseline sanitization, but complex email templates can sometimes bypass it or require excessive configuration. Using a sandboxed `<iframe srcDoc="..." sandbox="allow-popups allow-popups-to-escape-sandbox">` provides a robust, defense-in-depth isolation boundary by executing the content in a separate browsing context without script access.
**Prevention:** Default to using sandboxed `iframe` components with the `srcDoc` attribute when rendering untrusted or dynamic HTML content, avoiding `dangerouslySetInnerHTML` whenever possible.
