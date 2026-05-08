## 2024-05-14 - Initialize Journal
**Learning:** Initializing journal to track UX and accessibility learnings.
**Action:** Starting to document critical insights.

## 2024-05-14 - Dynamic ARIA labels for list items
**Learning:** Dynamic list items (like route stops) often use icon-only deletion buttons that miss dynamic contextual ARIA labels.
**Action:** Always verify that icon-only buttons in map functions use template literals to provide specific contextual labels (e.g., `aria-label={`Remove ${item.name}`}`).
