## 2024-05-24 - XSS Risk in Email Previews
**Vulnerability:** Using dangerouslySetInnerHTML to render email previews.
**Learning:** Even with DOMPurify, rendering untrusted HTML with dangerouslySetInnerHTML poses an XSS risk.
**Prevention:** Use a sandboxed iframe with srcDoc instead to create an isolated browsing context.
