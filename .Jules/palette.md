## 2026-05-31 - Missing aria-controls mapping in conditionally rendered React blocks
**Learning:** When using React conditional rendering for accordion content (e.g. `collapsed ? <Summary /> : <Full />`), the trigger button’s `aria-controls` target ID must be applied to *both* branch elements so the screen reader association remains unbroken in all states.
**Action:** Assign the `id` corresponding to `aria-controls` to the wrapper of all conditional rendering branches of an expandable section.
