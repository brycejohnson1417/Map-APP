## 2024-05-18 - Missing ARIA Labels on Icon-only Action Buttons
**Learning:** Icon-only buttons used for dismissive actions (like clearing a notification or removing an item from a list) often lack ARIA labels, making them invisible to screen readers in this application's components.
**Action:** Always verify that `<button>` tags containing only an icon component (e.g. `<X />`) have a clear and descriptive `aria-label` attribute.
