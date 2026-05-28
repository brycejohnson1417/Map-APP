## 2026-05-28 - Link Accordions with aria-controls
**Learning:** When creating an expandable section (accordion) toggled by a button, ensuring the trigger explicitly contains `aria-expanded={isExpanded}` and `aria-controls="expanded-section-id"` along with mapping the corresponding div to `id="expanded-section-id"` significantly improves screen reader accessibility and navigation clarity by linking the two pieces of content.
**Action:** Verify that accordion and collapsible section patterns include these ARIA attributes in all future components.
