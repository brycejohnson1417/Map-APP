## 2024-05-04 - Missing aria-expanded on collapsible triggers
**Learning:** Found a recurring pattern where toggle buttons controlling collapsible UI elements (like the PPP savings panel and mobile navigation menu) were missing the `aria-expanded` attribute. This is critical for screen reader users to understand the state of the content they are interacting with.
**Action:** Always ensure that any button functioning as a toggle for collapsible content includes an `aria-expanded` attribute that reflects the current visibility state of the controlled content.
