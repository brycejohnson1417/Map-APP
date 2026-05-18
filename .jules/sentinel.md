## 2025-02-18 - XSS via dangerouslySetInnerHTML in Email Preview
**Vulnerability:** A `div` in `components/accounts/ppp-savings-panel.tsx` was using `dangerouslySetInnerHTML` to render email preview HTML (`sanitizedEmailHtml`), which can still allow XSS if `DOMPurify` fails or misconfigured.
**Learning:** Using `dangerouslySetInnerHTML` is unsafe for rendering untrusted HTML even if pre-sanitized by DOMPurify. A more secure boundary is needed for dynamic user-provided or external email HTML content.
**Prevention:** Always use a sandboxed `iframe` with `srcDoc` and `sandbox=""` attributes to enforce a strict security boundary when rendering dynamic or untrusted HTML like email previews. This prevents execution of embedded scripts while allowing the content to be displayed correctly.
