## 2026-05-21 - Territory Workspace O(N*M) Route Stops Optimization
**Learning:** The territory workspace map renders used Array.find within Array.map during React renders, blocking the main thread for large pin counts and route stops.
**Action:** Replaced linear lookups with an O(1) Map dictionary instantiated in a top-level useMemo.
