## 2026-04-27 - Prevent XSS in clipboard and DOM using isomorphic-dompurify
**Vulnerability:** Found unescaped user-supplied HTML injected directly into the DOM via dangerouslySetInnerHTML and written to the system clipboard as a Blob.
**Learning:** Next.js SSR causes standard dompurify to fail because 'window' is not defined. We must use isomorphic-dompurify for safe server-side execution, and must also consider clipboard API injection as an attack vector.
**Prevention:** Always wrap dangerouslySetInnerHTML payloads with DOMPurify.sanitize(). Apply the same sanitization logic before committing text/html blobs to the user's system clipboard.
