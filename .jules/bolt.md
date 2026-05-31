## 2024-05-15 - [O(N*M) Loop Inside React useMemo Hook]
**Learning:** Using `Array.find` inside an `Array.map` within a React `useMemo` hook causes O(N*M) time complexity. For large data arrays like pins or lists, this can severely block the main thread during renders, causing performance degradation in the UI.
**Action:** Always construct a `Map` dictionary for O(1) lookups before doing `map()` array mapping within React hooks. This is a critical pattern when computing derived values in UI components.
