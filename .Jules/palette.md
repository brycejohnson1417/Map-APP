## 2026-06-11 - Accessible Custom Toggle Switches
**Learning:** Custom UI toggle switches (`<button role="switch">`) lack an implicit label like standard form inputs. They must explicitly provide an `aria-label` or `aria-labelledby` to ensure screen reader users understand what the switch controls, even if descriptive text exists nearby in the DOM.
**Action:** Always ensure custom switches have an explicit ARIA label. When modifying existing components, check for missing `aria-label`s on elements with `role="switch"`.
