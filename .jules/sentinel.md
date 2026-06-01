## 2024-05-18 - Prevent Reverse Tabnabbing
**Vulnerability:** External links (`target="_blank"`) missing `rel="noopener"`.
**Learning:** React/Next.js might not always automatically add `noopener` depending on configuration or versions, and relying solely on `noreferrer` might not be robust enough against reverse tabnabbing attacks where the newly opened tab can manipulate the original tab's `window.opener`.
**Prevention:** Always use both `rel="noopener noreferrer"` for defense in depth on `target="_blank"` anchor tags.
