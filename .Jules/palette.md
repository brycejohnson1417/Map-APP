## 2024-05-24 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found that custom notification dismiss and accordion toggle buttons lacked screen reader context, a common pattern when quickly building UI with icon libraries.
**Action:** When adding icon-only functional buttons, ensure they have an `aria-label` and `aria-expanded` (if applicable) to maintain accessibility for non-visual users.
