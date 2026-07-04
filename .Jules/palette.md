## 2024-07-04 - Accessible Accordion Toggles
**Learning:** When React conditional rendering toggles between summary and full views (e.g., `collapsed ? <Summary /> : <Full />`), screen readers lose track of the `aria-controls` target if the `id` is only on the expanded content. The `id` must be applied to *both* branch elements to ensure an unbroken association in all states.
**Action:** Use `useId()` to generate a unique ID and assign it to all conditional branches of an accordion's content.
