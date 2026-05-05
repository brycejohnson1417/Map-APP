## 2024-05-05 - Missing ARIA Labels on Icon Buttons
**Learning:** Found several floating action buttons and toast close buttons that only contained Lucide icons (`<X />`) with no accessible names. Since they aren't explicitly named, screen readers skip them or read generic names.
**Action:** Added `aria-label` attributes to these icon-only `<button>` components (`Remove from route` and `Dismiss notice`) to provide context for screen readers without breaking the minimalist design.
