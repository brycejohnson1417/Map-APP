## 2024-05-18 - Memoize list items
**Learning:** In `TerritoryWorkspace`, rendering the `PinRow` components list caused heavy re-renders when parent state (like active/selected IDs) changed, particularly for large numbers of pins (up to 1200+). Unmemoized child components with unmemoized callback props force React to rerender the entire list whenever the parent re-renders.
**Action:** Always `React.memo` list item components like `PinRow`, and wrap their event handler props (like `onFocus` and `onToggleRoute`) in `useCallback` inside the parent component to ensure stable reference identity.
