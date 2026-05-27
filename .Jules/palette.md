## 2024-05-27 - Context-Aware ARIA Labels for Dynamic Buttons
**Learning:** When generating dynamic lists (like routes or tags) with icon-only actions, it's not enough to provide generic ARIA labels like "Remove item". Screen reader users lose the context of *which* specific item is being removed if they tab through the list quickly.
**Action:** Always use template literals to include the item's specific name in the `aria-label` (e.g., `aria-label={\`Remove ${item.name} from route\`}`) to ensure clear and actionable feedback for assistive technologies.
