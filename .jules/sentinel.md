## 2024-05-24 - Fix XSS Vulnerability in PPP Savings Report
**Vulnerability:** The application was using `dangerouslySetInnerHTML` directly with unsanitized HTML data (`report.email.html`) from the PPP savings report API. This allows malicious actors to execute arbitrary scripts in the context of the application (Cross-Site Scripting, XSS).
**Learning:** React's `dangerouslySetInnerHTML` does not automatically sanitize its contents. Whenever displaying raw HTML, it's critical to validate and sanitize it to prevent XSS attacks.
**Prevention:** Use an established sanitization library like `isomorphic-dompurify` to parse and clean HTML data before passing it to `dangerouslySetInnerHTML`. Ensure this dependency is available and applied correctly to any raw HTML content.
