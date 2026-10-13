## 2023-10-13 - [aria-controls for conditional rendering]
**Learning:** When using React conditional rendering for content (e.g., `collapsed ? <Summary /> : <Full />`), assigning the `id` to only one branch will break the `aria-controls` screen reader association when the state toggles.
**Action:** Always assign the same generated `id` (e.g., via `useId()`) to BOTH branch elements to ensure the screen reader relationship remains unbroken in all states.
