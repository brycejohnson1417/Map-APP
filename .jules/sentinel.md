## 2024-05-24 - Missing noopener on external links
**Vulnerability:** External links (`target="_blank"`) missing `noopener` attribute (only using `noreferrer`).
**Learning:** React/Next.js might auto-inject `noopener` depending on configuration, but explicitly defining `rel="noopener noreferrer"` is required for strict defense-in-depth against reverse tabnabbing and ensures standard security across all browsers and deployments.
**Prevention:** Always explicitly include `noopener` alongside `noreferrer` for any `target="_blank"` anchor tags across the codebase.