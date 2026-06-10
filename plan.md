1. **Analyze O(n^2) or nested `.find()` in `.map()` performance issue:**
In `components/territory/territory-workspace.tsx`, `routeStops` calculates multiple `pins.find` inside a `.map` over `routeStopIds`.
```tsx
  const routeStops = useMemo(
    () =>
      routePlanningEnabled
        ? routeStopIds.map((id) => pins.find((pin) => pin.id === id)).filter((pin): pin is TerritoryAccountPin => Boolean(pin))
        : [],
    [pins, routePlanningEnabled, routeStopIds],
  );
```
If `pins` is large, this is an O(n * m) operation. We can replace it with an O(n) + O(m) hash map lookup. Since `selectedPin` also does `pins.find(id === selectedId)`, we can also benefit from creating `pinsById`. Or just use `pinsById` internally.

2. **Verify Memory:**
Memory says:
> Performance Coding Standard: To optimize array lookups and avoid O(N*M) time complexity (e.g., nesting Array.find within Array.map), construct a Map dictionary for O(1) lookups. This is especially critical inside React useMemo or useCallback hooks to prevent main thread blocking during renders.

3. **Plan**:
1. Open `components/territory/territory-workspace.tsx`.
2. Add `pinsById` `useMemo` right below `pins = data.pins`.
3. Update `selectedPin` to use `pinsById.get(selectedId)`.
4. Update `routeStops` to use `pinsById.get(id)`.
5. Update `getLeafletClickPointForPin` inside `__MAP_APP_TEST` to use `pinsById.get(pinId)`. It's safe since `pinsById` can be added to the `useEffect` dependency array or we can just use `pinsById` and `[pinsById]` as dependencies. Wait, `__MAP_APP_TEST` uses `pins.find(hasUsableCoordinates)?.id ?? null` too, which doesn't benefit from `pinsById` but `getLeafletClickPointForPin` does. I will update `__MAP_APP_TEST`'s `useEffect` to depend on `pinsById` instead of `pins`. Actually, `getFirstMappablePinId` still needs `pins`, so dependencies should be `[pins, pinsById]`.

4. **Prepare Pre-Commit Step:**
Run format, lint checks, verify everything.
