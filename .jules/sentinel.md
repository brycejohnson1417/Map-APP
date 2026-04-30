## 2024-03-24 - Cross-Site Scripting (XSS) via un-sanitized API response
**Vulnerability:** Found `dangerouslySetInnerHTML={{ __html: report.email.html }}` rendering the raw `report.email.html` payload in `components/accounts/ppp-savings-panel.tsx`.
**Learning:** This existed because the email payload was likely assumed to be safe originating from the backend or an external API response, but directly placing it in `dangerouslySetInnerHTML` bypasses React's escaping mechanism. Even if the backend generates it, it should be sanitized on the frontend to defend in depth.
**Prevention:** Always use `isomorphic-dompurify` (to support Next.js SSR) to sanitize any HTML string passed to `dangerouslySetInnerHTML`.
