## 2025-02-18 - Prevent XSS in SSR React components
**Vulnerability:** XSS vulnerability in `dangerouslySetInnerHTML`
**Learning:** Standard DOMPurify requires a `window` object and breaks Server-Side Rendering (SSR) in Next.js.
**Prevention:** Use `isomorphic-dompurify` to sanitize HTML strings when using `dangerouslySetInnerHTML` to ensure compatibility with Next.js server components.
