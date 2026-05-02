## 2024-03-24 - Fix XSS in PPP savings panel
**Vulnerability:** XSS vulnerability through dangerouslySetInnerHTML when displaying raw HTML string in PPP savings panel.
**Learning:** React dangerouslySetInnerHTML bypasses normal XSS protections. While the current string comes from our server, it could still contain malicious input if upstream data sources are compromised.
**Prevention:** Sanitize raw HTML strings with isomorphic-dompurify before passing to dangerouslySetInnerHTML.
