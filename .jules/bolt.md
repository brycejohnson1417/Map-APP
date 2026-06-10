## $(date +%Y-%m-%d) - Optimize nested .find() inside .map() with O(1) Map lookup
**Learning:** Performance Coding Standard: To optimize array lookups and avoid O(N*M) time complexity (e.g., nesting Array.find within Array.map), construct a Map dictionary for O(1) lookups. This is especially critical inside React useMemo or useCallback hooks to prevent main thread blocking during renders.
**Action:** Use a `Map` when doing `.find()` repeatedly, particularly in mapping operations over an ID list inside React hooks like `useMemo`.
