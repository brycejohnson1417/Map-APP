## 2024-05-15 - Secure Email Previews using Sandboxed Iframes
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML` when rendering dynamic HTML (e.g. email previews).
**Learning:** `dangerouslySetInnerHTML` is inherently risky, even with basic sanitization. An `iframe` with `srcDoc` and `sandbox=""` creates an isolated browsing context that prevents CSS inheritance and restricts scripts, providing a much stronger security boundary.
**Prevention:** Prioritize using a sandboxed `iframe` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` (to permit necessary links while omitting `allow-scripts` and `allow-same-origin`) instead of `dangerouslySetInnerHTML` when rendering untrusted or dynamic HTML content like email previews.
