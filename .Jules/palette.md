## 2024-07-03 - Custom Toggle Switches (role="switch") without aria-label
**Learning:** Found custom toggle switch components (buttons with `role="switch"`) in the `FraterniteesPortal` that do not provide `aria-label` or `aria-labelledby`, violating the memory directive regarding custom toggle switches lacking embedded visible text. This makes them inaccessible to screen readers as they won't know what setting the switch toggles.
**Action:** Always add an `aria-label` (e.g., `aria-label={\`Toggle ${label}\`}`) to toggle switches if they do not contain descriptive text inside the button.
