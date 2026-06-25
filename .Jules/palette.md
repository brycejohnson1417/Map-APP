## 2024-06-25 - Explicit ARIA Labels Required for Custom Toggles
**Learning:** In this application's component pattern, custom `role="switch"` toggles are visually placed next to descriptive text blocks, but they are icon-only and lack embedded visible text inside the button element itself. This visually implicit association fails for screen readers.
**Action:** Always provide an explicit `aria-label` (e.g., `aria-label="Toggle [Feature]"`) or `aria-labelledby` on these custom toggle switches to ensure screen reader accessibility, even if descriptive text exists nearby in the visual layout.
