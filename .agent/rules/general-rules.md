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

## 3. Styling & UI Framework (NativeWind v4 is MANDATORY)
- **Always use NativeWind v4 (Tailwind CSS) exclusively**: All UI components, screens, modals, layouts, buttons, cards, and badges MUST be styled using NativeWind `className="..."` utility classes. **NEVER fall back to legacy `StyleSheet.create` objects.**
- **Use Semantic Design Tokens**: Use the design tokens configured in `tailwind.config.js` (`bg-canvas`, `bg-surface`, `bg-surface-elevated`, `bg-brand-navy`, `text-brand-navy`, `bg-brand-blue`, `border-border`, `font-geist-bold`, `font-inter`, etc.) to maintain the Mikana Light Mode standard.
- **React Native Safe Utility Classes**: Never use web-only CSS classes (such as `transition-all` or non-standard arbitrary color opacities) that crash NativeWind's `react-native-css-interop` engine on Android Hermes.


