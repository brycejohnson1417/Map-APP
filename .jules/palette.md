## 2024-06-01 - Proper ARIA association in React conditional rendering
**Learning:** When creating an expandable section (accordion) with conditionally rendered contents in React (e.g., `collapsed ? <Summary /> : <Full />`), the target ID must be assigned to *both* branch elements to ensure the screen reader association remains unbroken in all states.
**Action:** When implementing accordions, always apply `id="expanded-section-id"` to both branches of the conditional render, matching the `aria-controls` attribute of the trigger `<button>`.

## 2024-06-01 - Avoid static ID collisions in components
**Learning:** Hardcoding static DOM IDs like `id="ppp-savings-content"` inside a React component instance can cause collision issues if the component is rendered multiple times on the same page.
**Action:** Use React's `useId()` hook to dynamically generate a unique identifier and assign it to the DOM elements, allowing reliable and valid accessibility associations regardless of how many components are rendered.
