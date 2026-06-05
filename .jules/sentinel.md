## 2026-06-05 - Secure Email Previews with Iframes
**Vulnerability:** XSS risk from using `dangerouslySetInnerHTML` to render dynamically generated HTML email previews.
**Learning:** Even when used with `DOMPurify`, `dangerouslySetInnerHTML` can be risky and doesn't fully isolate styles or malicious code. An iframe is a much more secure standard for dynamic HTML previews.
**Prevention:** Use a sandboxed `<iframe srcDoc={html}>` instead of `dangerouslySetInnerHTML`. Ensure `sandbox="allow-popups allow-popups-to-escape-sandbox"` to allow links to open securely, while strictly omitting `allow-scripts` and `allow-same-origin` to maintain strict isolation.
