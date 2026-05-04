## 2024-05-24 - Prevent XSS via dangerouslySetInnerHTML
**Vulnerability:** XSS vulnerability through use of naked `dangerouslySetInnerHTML`.
**Learning:** `dangerouslySetInnerHTML` directly renders a string as HTML, presenting an XSS attack vector if the source of HTML could be compromised or manipulated by an attacker, even if mostly safe. The use in `ppp-savings-panel.tsx` took raw HTML from the server and rendered it without sanitization on the client.
**Prevention:** Use `isomorphic-dompurify`'s `DOMPurify.sanitize()` method to sanitize strings containing HTML before inserting them into the DOM using `dangerouslySetInnerHTML` to remove malicious scripts.
