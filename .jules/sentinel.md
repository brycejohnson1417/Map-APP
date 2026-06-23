## 2024-06-23 - Prevent XSS in Email Preview
**Vulnerability:** A `dangerouslySetInnerHTML` was being used to render an email preview based on dynamically created strings, introducing an XSS risk even when run through DOMPurify.
**Learning:** `dangerouslySetInnerHTML` shouldn't be used to render dynamically created HTML content without restrictions since even with sanitation like DOMPurify some edge cases might be missed.
**Prevention:** Use an iframe with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` attribute for strict sandboxing instead. Include inline styles if required because CSS framework classes won't penetrate the iframe boundaries.
