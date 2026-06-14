## 2026-06-14 - Add aria-controls to elements with aria-expanded
**Learning:** Toggle buttons with `aria-expanded` need a matching `aria-controls` attribute to inform screen readers what exact content they reveal/hide. When the toggle is inside a mapped list or a reusable component, static IDs will cause DOM ID collisions.
**Action:** Always link `aria-expanded` triggers directly to their content using `aria-controls`. Use `React.useId()` inside reusable components, or append the unique item ID (e.g. `content-${item.id}`) inside loops to guarantee ID uniqueness.
## 2026-06-14 - Conditionally applying aria-controls
**Learning:** If the content block targeted by `aria-controls` is conditionally rendered in React (i.e., removed from the DOM when collapsed), providing an `aria-controls` ID when the target is absent creates a dangling reference (WCAG `aria-valid-attr-value` violation).
**Action:** When content is conditionally mounted, either keep a persistent wrapping div in the DOM to attach the ID to, or conditionally apply the `aria-controls` attribute itself (e.g. `aria-controls={expanded ? id : undefined}`).
