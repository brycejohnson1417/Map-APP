## 2024-05-24 - Role=Switch Buttons Need Aria Labels
**Learning:** Custom toggle switches (`<button role="switch">`) that are icon-only or lack embedded visible text must explicitly include an `aria-label` or `aria-labelledby` to ensure screen reader accessibility.
**Action:** Adding `aria-label={label}` to the `role="switch"` button in `PluginToggle` in `components/fraternitees/fraternitees-portal.tsx`.
