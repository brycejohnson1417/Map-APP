# Design System

This design system is the portable source of truth for frontend work in this repository. Build with existing product patterns first, then shadcn/ui, Tailwind, and small local primitives. Do not invent one-off visual styles when a token, component, or interaction pattern already exists.

## Product Feel

Interfaces should feel precise, premium, quiet, and operationally fast: Linear-grade density, Vercel-grade polish, Arc-grade interaction detail, and Notion-grade clarity. Avoid generic AI dashboards, decorative blobs, oversized marketing cards, vague gradients, and placeholder-heavy screens.

## Foundations

- Type: use the app font stack and preserve readable numeric rendering.
- Radius: use 6px to 8px for cards, controls, popovers, and modals unless an existing component already sets a stricter radius.
- Spacing: use a consistent 4px-based scale. Compact tools should favor `gap-2`, `gap-3`, and `p-3`; page sections should breathe without becoming hero-like.
- Color: use semantic product tokens for background, foreground, muted text, border, accent, destructive, success, warning, and info states.
- Borders: prefer subtle borders and separators over heavy shadows. Shadows should communicate layering, not decoration.
- Motion: use short, useful motion for feedback, state changes, focus, loading, hover, and transitions only.

## Components

- Use the repository's existing components first.
- Use lucide icons for recognizable actions: save, edit, delete, filter, search, upload, download, refresh, settings, close, check, alert, external link, and navigation.
- Cards are for repeated entities, modals, and genuinely framed tool surfaces. Do not put UI cards inside other UI cards.
- Settings and configuration must be first-class UI: real forms, clear validation, save/cancel flows, status indicators, loading states, error recovery, and successful confirmation.
- Empty states must offer the next real action. Avoid fake sample data unless the user explicitly asked for mock data.

## Interaction Rules

- Every requested feature must be usable from the browser UI end-to-end.
- Buttons must show immediate feedback through disabled, loading, success, or error states.
- Forms must validate before submit, preserve user input on errors, and make recovery obvious.
- Data views must support realistic scanning: sorting, filtering, searching, pagination or virtualization when needed, and clear row/action affordances.
- Connection flows must expose state: disconnected, connecting, connected, failed, expired, and reconnecting.
- Responsive behavior must be designed, not accidental. Controls and text must not overlap at mobile or desktop widths.

## Quality Bar

Before calling frontend work complete, run the app in a browser, click through the real user flow, capture proof where relevant, and fix anything that feels cheap, janky, confusing, slow, incomplete, or disconnected from the backend.
