## 2024-07-06 - Missing ARIA Labels on Switch Toggles
**Learning:** Custom toggle switches (`role="switch"`) used in the UI, even if they have descriptive text nearby, must explicitly include an `aria-label` (or `aria-labelledby`) for proper screen reader support. The visual context does not automatically translate to the interactive element without it.
**Action:** Ensure all custom toggle switches explicitly provide an `aria-label` attribute if they do not contain embedded visible text.
