
## 2024-05-25 - ARIA Labels in Map UI Lists
**Learning:** Map-based UIs with repetitive element lists (like route stops) often omit context in their remove buttons, leading to identical generic readouts for screen readers. Using template literals with the entity name (e.g., `Remove ${pin.name} from route`) prevents "Remove, Remove, Remove" redundancy for AT users.
**Action:** Always inject contextual entity names into ARIA labels for repetitive icon-only actions inside `map()` blocks.
