## 2026-05-25 - Secure HTML Rendering in React
**Vulnerability:** XSS risk via `dangerouslySetInnerHTML`
**Learning:** Even with DOMPurify, directly injecting HTML strings limits control over the execution context. Using an iframe provides a dedicated browsing context.
**Prevention:** Utilize `<iframe srcDoc={content} sandbox="allow-popups allow-popups-to-escape-sandbox" />` instead of `dangerouslySetInnerHTML` for isolating untrusted UI components.
