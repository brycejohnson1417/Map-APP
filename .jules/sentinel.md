## 2024-05-12 - Prevent TabNabbing vulnerability
 **Vulnerability:** Links opening in a new tab (`target="_blank"`) did not have the `noopener` attribute in their `rel` property.
 **Learning:** Without `noopener`, the newly opened page can access the `window.opener` object, potentially allowing it to navigate the original page to a malicious URL.
 **Prevention:** Always include `rel="noopener noreferrer"` when using `target="_blank"` on anchor tags.
