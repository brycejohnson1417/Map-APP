## 2024-07-04 - XSS Prevention via Sandboxed Iframe in Email Preview
**Vulnerability:** Email preview rendered using `dangerouslySetInnerHTML`.
**Learning:** Even with DOMPurify, rendering dynamic HTML directly into the DOM can lead to XSS or styling clashes. Using an `iframe` with `srcDoc` and a `sandbox` attribute (`allow-popups allow-popups-to-escape-sandbox`) provides true isolation without needing a separate endpoint.
**Prevention:** For untrusted or complex HTML previews, default to sandboxed iframes. Manually inject necessary styles into the `srcDoc` to ensure correct rendering.