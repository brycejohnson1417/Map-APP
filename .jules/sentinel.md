## 2024-07-02 - Replace dangerouslySetInnerHTML with Iframe

**Vulnerability:** Used `dangerouslySetInnerHTML` for rendering email HTML previews, even with DOMPurify.
**Learning:** `dangerouslySetInnerHTML` can still be a risk if DOMPurify fails to catch an edge-case bypass. Iframes provide a robust, defense-in-depth sandbox context that completely blocks script execution when `allow-scripts` is omitted from the `sandbox` attribute. Also learned that Tailwind classes on the iframe element do not apply to the `srcDoc` content, requiring an inline `<style>` tag in the `srcDoc` itself.
**Prevention:** For untrusted or dynamic HTML, prefer `<iframe srcDoc="..." sandbox="...">` over `dangerouslySetInnerHTML`.