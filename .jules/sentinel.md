## 2025-05-26 - [Replaced dangerouslySetInnerHTML with iframe in email preview]
**Vulnerability:** [XSS vulnerability risk via dynamically rendered untrusted HTML]
**Learning:** [It existed because rendering HTML directly can expose the application to malicious scripts inside untrusted emails. While DOMPurify is used, there are possible edge cases in sanitization that an iframe with sandbox covers as defense-in-depth.]
**Prevention:** [Prefer using a sandboxed `<iframe>` with the `srcDoc` attribute over `dangerouslySetInnerHTML`. Use `sandbox="allow-popups allow-popups-to-escape-sandbox"` for displaying emails allowing links to work, whilst strictly preventing scripts and same-origin context inheritance.]
