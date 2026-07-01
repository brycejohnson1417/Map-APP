## 2024-07-01 - Prevent reverse tabnabbing on external links
**Vulnerability:** External links with `target="_blank"` missing `rel="noopener noreferrer"`.
**Learning:** React/Next.js might not always auto-add these attributes depending on how the tag is structured, and it's safer to be explicit to prevent reverse tabnabbing.
**Prevention:** Always explicitly include `rel="noopener noreferrer"` when using `target="_blank"`.

## 2024-07-01 - Prevent XSS in dynamic email rendering
**Vulnerability:** Using `dangerouslySetInnerHTML` directly in the DOM to render dynamic email HTML (even if sanitized by DOMPurify).
**Learning:** DOMPurify sanitizes, but doesn't isolate the environment. An attacker could potentially find a DOMPurify bypass, or CSS could leak and affect the application UI. Rendering untrusted HTML (like an email preview) should be done in an isolated environment.
**Prevention:** Always use a sandboxed `<iframe>` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` instead of `dangerouslySetInnerHTML` when rendering dynamic, potentially untrusted HTML content like emails.
