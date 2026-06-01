# Design System

Map App uses a restrained operational UI for field teams and managers. The browser app is the source of truth, so controls must be visible, complete, and usable without backend-only setup.

## Foundations

- Typography: use the configured Space Grotesk sans font for product UI and JetBrains Mono only for technical identifiers.
- Color tokens live in `app/globals.css`; prefer `var(--background)`, `var(--surface-card)`, `var(--surface-elevated)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-subtle)`, `var(--accent-primary)`, and `var(--accent-secondary-strong)` over ad hoc colors.
- Product surfaces should feel dense, legible, and task-oriented. Avoid marketing hero layouts inside authenticated workflows.
- Cards are for repeated records, modals, and framed tools. Do not nest cards inside cards.
- Border radius should stay at `rounded-lg`, `rounded-xl`, or `rounded-2xl` for product controls unless an existing component demands otherwise.

## Controls

- Use icon-plus-label buttons for commands and lucide icons when available.
- Use segmented controls for mutually exclusive view modes and visibility settings.
- Use text inputs, textareas, checkboxes, or toggles for editable state. Every saveable edit needs visible save/cancel or confirmation feedback.
- Destructive actions require an explicit confirmation state in the UI.
- Loading, empty, error, permission-denied, unsaved-change, and success states must be visible on the page that owns the workflow.

## Layout

- Authenticated workflows should prioritize the working surface first, not explanatory prose.
- Desktop layouts can use sidebars and split panes for list/detail workflows.
- Mobile layouts must stack without hiding the primary action or making text overflow.
- Use stable dimensions for repeated rows, icon buttons, counters, and action bars so status changes do not shift the layout.

## Route Builder Pattern

- Route planning starts from visible account selections in the territory map/list and saves to `/routes`.
- Missing-coordinate accounts must be shown in a review bucket, not silently dropped.
- Saved routes expose list, detail, edit/share, duplicate, archive, delete confirmation, and call-list completion controls directly in the UI.
- Route completion writes app-owned activity state only. It must not send email or mutate provider systems.
