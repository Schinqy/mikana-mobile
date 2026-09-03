---
trigger: always_on
---

# General Rules

These rules dictate general behavior and maintenance procedures for the Mikana Mobile project.

## 1. Documentation Maintenance
- You must always keep `changelog.md`, `memory.md`, and `lessons.md` up to date.
- Whenever a significant feature, bug fix, or project milestone is reached, record it in `changelog.md`.
- Whenever a new engineering lesson or tool workaround is discovered, append a new entry to `lessons.md`.

## 2. Knowledge Retention & Anti-Slop
- Always consult `memory.md` and `lessons.md` regularly to avoid repeating past mistakes.
- Enforce the **Zero-Emoji Policy** across UI controls, buttons, badges, status pills, headers, and tabs.
- Use hairline borders (`#27272a`), surface lightness elevation, and clean Lucide vector icons for a high-craft Linear/Raycast design standard.

## 3. Styling & UI Framework (NativeWind)
- **Always use NativeWind v4 (Tailwind CSS) for styling**: All UI components, screens, modals, layouts, buttons, and badges must be built using NativeWind `className="..."` utility classes.
- Use the semantic design tokens configured in `tailwind.config.js` (`bg-canvas`, `bg-surface`, `bg-brand-navy`, `text-brand-navy`, `bg-accent-blue`, `border-border`, etc.) to maintain the Mikana Light Mode brand standard.

