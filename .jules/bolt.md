## 2024-06-25 - Replace O(N*M) array lookup with O(1) Map in React hooks
**Learning:** Performing `Array.find` inside an `Array.map` within a React `useMemo` hook causes O(N*M) time complexity, potentially blocking the main thread during component renders with large data arrays.
**Action:** Always construct a `Map` dictionary for O(1) lookups before iterating over arrays to perform item matching, especially inside `useMemo` or `useCallback` hooks.
