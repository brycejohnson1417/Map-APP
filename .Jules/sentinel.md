
## 2024-10-10 - Sandboxed Iframes for HTML Previews
**Vulnerability:** XSS risk from using dangerouslySetInnerHTML for email previews, even when using DOMPurify.
**Learning:** DOMPurify cannot catch all edge cases or zero-day bypasses. Sandboxed iframes (with srcDoc) provide hardware-level isolation (browsing context isolation) that fundamentally prevents script execution when allow-scripts is omitted.
**Prevention:** Always prioritize using a sandboxed iframe with the srcDoc attribute over dangerouslySetInnerHTML for rendering dynamic or untrusted HTML. Ensure sandbox="allow-popups allow-popups-to-escape-sandbox" is used to allow link clicks while maintaining script isolation, and manually inject inline <style> tags to apply desired styling.
