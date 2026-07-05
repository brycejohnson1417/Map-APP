## 2024-05-18 - Replacing dangerouslySetInnerHTML with Sandboxed Iframes
**Vulnerability:** XSS vulnerability in dynamically generated email preview rendered using dangerouslySetInnerHTML, even with DOMPurify.
**Learning:** When displaying dynamic or user-generated HTML in React, dangerouslySetInnerHTML should be avoided entirely in favor of an isolated browsing context. Applying external CSS classes (like Tailwind) to an iframe does not style the inner document; styles must be injected inline via a <style> tag within the srcDoc.
**Prevention:** Always use a sandboxed iframe (<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={html}>) instead of dangerouslySetInnerHTML when previewing rich text content.
