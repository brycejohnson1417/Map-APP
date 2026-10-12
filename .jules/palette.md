## 2026-10-12 - Focus Management in Shared Primitives
**Learning:** Using `outline-none` on form elements without providing fallback `focus-visible` or `focus-within` styles completely breaks keyboard navigation visibility. This is a common accessibility regression when building custom UI components.
**Action:** Whenever applying `outline-none` to remove default browser rings, explicitly add `focus-visible:ring-2` (or `focus-within:ring-1`) using existing design tokens like `--text-primary` or `--accent-primary` to ensure screen reader and keyboard-only users can navigate safely.
