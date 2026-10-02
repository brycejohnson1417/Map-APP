## 2023-10-02 - Replace dangerouslySetInnerHTML with iframe in PPP savings email preview

**Vulnerability:**
The `PppSavingsPanel` component uses `dangerouslySetInnerHTML` to render a dynamic HTML email preview. Even with `DOMPurify.sanitize`, rendering user-generated or external HTML directly into the application DOM using `dangerouslySetInnerHTML` can pose security risks, particularly XSS if DOMPurify fails to catch something or is bypassed. Furthermore, styling applied directly to the email content may bleed out or application styling may bleed in.

**Learning:**
To prevent XSS when rendering dynamic or untrusted HTML (e.g., email previews), we should prioritize using a sandboxed `<iframe>` with the `srcDoc` attribute instead of `dangerouslySetInnerHTML`, even when used with `DOMPurify`. Because an iframe creates an isolated browsing context, applying CSS classes directly to the `<iframe>` tag will not style the inner document; we must manually inject an inline `<style>` tag into the `srcDoc` HTML string to apply fonts, colors, or sizing to the content itself.

**Prevention:**
Always use an iframe with `srcDoc` for rendering untrusted or third-party HTML content. Add `sandbox="allow-popups allow-popups-to-escape-sandbox"` to permit link clicking while omitting `allow-scripts` and `allow-same-origin` to ensure strict isolation. Include a `<style>` block in the `srcDoc` to handle inner styling (like Tailwind resets).
