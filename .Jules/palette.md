## 2024-05-11 - Contextual ARIA labels for dynamic lists
**Learning:** When adding ARIA labels to icon-only buttons inside dynamic, mapped lists (like a list of route stops), using generic static labels creates a poor experience for screen reader users since multiple identical elements cannot be distinguished.
**Action:** Use template literals to provide specific contextual labels (e.g., `aria-label={\`Remove ${pin.name} from route\`}`) rather than generic static labels to ensure screen readers provide useful, actionable context for each list item.
