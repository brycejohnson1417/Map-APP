## 2024-06-24 - Secure Email Previews with Iframes

**Vulnerability:** XSS risk due to usage of `dangerouslySetInnerHTML` for rendering dynamic email templates in `components/accounts/ppp-savings-panel.tsx`.
**Learning:** `DOMPurify` combined with `dangerouslySetInnerHTML` is good, but for full HTML documents like email templates, a sandboxed `<iframe>` with `srcDoc` provides a stronger defense-in-depth isolation boundary, particularly preventing arbitrary style injection and script execution without relying purely on regex-based sanitization algorithms. Inline styles must be injected to style the `iframe` inner content properly.
**Prevention:** Use `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={htmlString} />` over `dangerouslySetInnerHTML` when rendering dynamic or user-generated HTML content where styling and layout isolation are also desired. Always ensure no `allow-scripts` or `allow-same-origin` are present to block executing JavaScript.
