## 2024-06-12 - ARIA Labels on Toggle Switches

**Learning:** Custom toggle switches (e.g., `<button role="switch">`) that are icon-only or lack embedded visible text must explicitly include an `aria-label` or `aria-labelledby`, even if descriptive text exists nearby, to ensure screen reader accessibility. Users navigating via keyboard or screen reader directly to the switch may not have the context of adjacent descriptive text.

**Action:** Always add an `aria-label` or `aria-labelledby` property to any toggle switch or icon button to ensure accessible navigation.