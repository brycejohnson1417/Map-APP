## 2024-09-30 - Replace dangerouslySetInnerHTML with iframe
**Vulnerability:** XSS risk due to rendering untrusted email HTML using dangerouslySetInnerHTML, even with DOMPurify.
**Learning:** For defense in depth against XSS when rendering dynamic HTML like email previews, DOMPurify alone might not be enough. An isolated iframe provides a stronger security boundary.
**Prevention:** Prioritize using a sandboxed <iframe> with the 'srcDoc' attribute instead of 'dangerouslySetInnerHTML'. Use 'sandbox="allow-popups allow-popups-to-escape-sandbox"' to permit link clicking while omitting 'allow-scripts' and 'allow-same-origin'. Inject inline <style> to apply styles to the iframe content.
