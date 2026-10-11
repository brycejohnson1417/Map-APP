## 2024-10-11 - Prevent XSS in Email Previews
**Vulnerability:** Use of `dangerouslySetInnerHTML` to render email previews.
**Learning:** Even when sanitized with DOMPurify, rendering user-controlled HTML directly in the DOM using `dangerouslySetInnerHTML` is risky, as it executes in the same browsing context as the application. Using a sandboxed `iframe` with `srcDoc` is a safer approach for rendering untrusted HTML like emails, as it creates an isolated browsing context.
**Prevention:** Avoid `dangerouslySetInnerHTML` for untrusted or dynamic HTML content. Use sandboxed `iframes` (`<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc="...">`) instead to isolate the rendered content.
