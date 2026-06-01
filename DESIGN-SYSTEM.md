# Map-APP Design System

Map-APP is a dense, operational field-sales workspace. Screens should feel calm, direct, and built for repeated use rather than like a marketing site.

## Foundations

- Fonts: `Space Grotesk` for UI text and `JetBrains Mono` for code or tabular operational values.
- Background: `--background` (`#f3f0e8`) for app chrome.
- Surfaces: `--surface-card` for primary panels and `--surface-elevated` for controls, nested tools, and secondary areas.
- Text: `--text-primary` for decisions and actions, `--text-secondary` for supporting content, `--text-tertiary` for labels and metadata.
- Borders: `--border-subtle` for default separation, `--border-strong` for hover, selected, or dashed empty states.
- Accents: `--accent-primary` for primary action, `--accent-secondary-strong` for navigation/status emphasis, `--accent-success` and `--accent-danger` for outcome states.

## Component Rules

- Keep operational tools compact and scannable. Use restrained headers, visible controls, and clear state text.
- Use existing CSS variables from `app/globals.css` before adding one-off colors.
- Use lucide icons in action buttons when an icon exists.
- Prefer `rounded-xl` or `rounded-2xl` for controls and repeated items. Reserve larger radii for existing shell panels only.
- Buttons must expose accessible names and state. Icon-only buttons require `aria-label`; expanding controls require `aria-expanded` and a valid `aria-controls` target.
- Preview or embedded content must have explicit dimensions, accessible titles, and sandboxing where HTML content is rendered.

## Layout

- Avoid nested decorative cards. A page section can contain repeated item cards or a framed tool, but should not become card-in-card chrome.
- Keep text inside controls short enough to fit on mobile. Wrap button groups instead of shrinking text with viewport units.
- Browser-facing features must be interactive from the UI: visible controls, loading and error states, save/cancel behavior, and end-to-end wiring.
