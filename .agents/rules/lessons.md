# Lessons Learned & Anti-Patterns

## Design Standards
- **Zero-Emoji Policy:** Never embed emojis in UI controls, navigation tabs, buttons, or badges. Use Lucide icons instead.
- **Dark Mode Surfaces:** Never use standard drop shadows. Use border tokens (`border-subtle: #27272a`) and surface tokens (`bg-surface: #121215`, `bg-elevated: #18181b`).
- **Semantic Accents:** Use desaturated alpha tints for status badges (e.g., emerald for active/won, amber for medium urgency/quoting, rose for high urgency/lost, blue for info/captured).

## React Native / Expo Lessons
- Always specify `nativewind` in `tailwind.config.js` and wrap `metro.config.js` with `withNativeWind`.
- Use `useCallback` or stable store selectors for smooth list scrolling in lead feeds.
- Ensure RevenueCat SDK initialization is wrapped in a try/catch so mock mode works seamlessly in development and Expo Go.
