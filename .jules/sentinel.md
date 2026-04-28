## 2025-02-28 - XSS vulnerability in HTML email preview
**Vulnerability:** XSS vulnerability where `report.email.html` was rendered using `dangerouslySetInnerHTML` without proper HTML sanitization in `./components/accounts/ppp-savings-panel.tsx`.
**Learning:** `dangerouslySetInnerHTML` should never take an unsanitized payload directly from an external API or unknown source. Even if the data originates from a trusted internal API (like a Supabase database), treating all user-facing data as potentially unsafe is critical to prevent stored XSS attacks.
**Prevention:** Use `isomorphic-dompurify` to sanitize HTML payloads right before rendering them via `dangerouslySetInnerHTML` in React components.
