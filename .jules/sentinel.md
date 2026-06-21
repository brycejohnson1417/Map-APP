## 2024-06-21 - [Email Preview XSS Defense-in-Depth]
**Vulnerability:** Email preview used `dangerouslySetInnerHTML` with `DOMPurify`.
**Learning:** While `DOMPurify` is a good first step, utilizing a sandboxed `<iframe>` with `srcDoc` and `sandbox="allow-popups allow-popups-to-escape-sandbox"` provides a stronger defense-in-depth against XSS. It prevents scripts from executing and isolates the preview content, even if DOMPurify fails or a bypass is found. Injecting a `<style>` block via `srcDoc` ensures basic styling applies.
**Prevention:** Avoid `dangerouslySetInnerHTML` for untrusted or dynamic HTML like email bodies. Use sandboxed iframes as the standard rendering approach for previews.
