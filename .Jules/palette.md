## 2024-06-28 - Add Aria Labels to Custom Switches
**Learning:** Custom toggle switches (e.g., `<button role="switch">`) that are icon-only or lack embedded visible text must explicitly include an `aria-label` (e.g., `aria-label="Toggle [Feature]"`) or `aria-labelledby`, even if descriptive text exists nearby, to ensure screen reader accessibility.
**Action:** When implementing a `role="switch"` element, make sure to add a descriptive `aria-label` or use `aria-labelledby` referencing an existing label.
