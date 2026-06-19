## 2024-03-24 - Optimize O(N*M) Array.find lookups in Map operations
**Learning:** React component re-renders can be slow when using an `Array.find` inside of an `Array.map` because it gives an O(N*M) complexity.
**Action:** When filtering objects out of a list, use a mapping Dictionary/Map created with O(N) complexity and look items up with `dictionary.get(id)` for O(1) lookups to give O(N+M) total complexity.
