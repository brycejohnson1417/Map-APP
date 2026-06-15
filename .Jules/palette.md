## 2024-06-15 - Missing ARIA label on role="switch" buttons
**Learning:** Custom toggle switches (`<button role="switch">`) that are icon-only or lack embedded visible text must explicitly include an `aria-label` or `aria-labelledby`, even if descriptive text exists nearby, to ensure screen reader accessibility.
**Action:** Adding `aria-label` to these components to fix screen reader accessibility.
