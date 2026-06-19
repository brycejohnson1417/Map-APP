## 2024-06-19 - Accessibility for Custom Toggle Switches

**Learning:** Custom toggle switches (e.g., `<button role="switch">`) that lack embedded visible text require an explicit `aria-label` (or `aria-labelledby`) attribute to be accessible to screen readers, even when descriptive text is present visually nearby. Screen readers focus on the button itself and will not necessarily read the surrounding text context unless explicitly associated.

**Action:** Ensure all icon-only or visually distinct interactive elements, such as toggle switches, have descriptive `aria-label` attributes to communicate their purpose to assistive technologies.