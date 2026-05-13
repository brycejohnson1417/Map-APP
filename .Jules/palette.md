## 2026-05-13 - Contextual ARIA labels for dynamic lists
**Learning:** When adding `aria-label` to icon-only buttons inside mapped dynamic lists, using template literals to provide specific contextual labels (e.g., `aria-label={\`Remove \${item.name}\`}`) is much better than generic static labels.
**Action:** Use contextual template literals for `aria-label`s in dynamic lists.
