## 2025-02-12 - Icon-only buttons lacking context
**Learning:** Found multiple icon-only buttons (like the `X` icon to close notices or remove mapped routes) missing `aria-label`s, rendering them functionally invisible to screen reader users in the territory workspace.
**Action:** Applied dynamic string interpolation for contextual lists (`aria-label={\`Remove \${pin.name} from route\`}`) and added simple descriptive static labels (`aria-label="Dismiss notice"`) to ensure accessible interaction patterns for UI primitives.
