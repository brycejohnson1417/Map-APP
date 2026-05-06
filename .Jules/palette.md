## 2026-05-06 - Missing ARIA Labels on Icon Buttons
**Learning:** Found multiple instances where interactive icon-only buttons (e.g., dismiss banners, dynamic list item actions) lack descriptive `aria-label`s, breaking accessibility for screen readers.
**Action:** Ensure that all dynamically generated icon-only actions and utility buttons (like "Dismiss notice") are explicitly provided with an `aria-label`.
