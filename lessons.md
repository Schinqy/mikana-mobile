# Lessons Learned & Anti-Patterns

> **RULE:** This file is APPEND-ONLY. Never overwrite or remove existing entries.
> Add new lessons with timestamps at the bottom of the file.

---

### [2026-08-30] Initial Mobile Architecture Setup
- **TypeScript 6.0 `baseUrl` deprecation:** In TS 6.0 with Expo SDK 57, setting `baseUrl: "."` causes a deprecation diagnostic unless `"ignoreDeprecations": "6.0"` is explicitly declared in `compilerOptions`.
- **Lucide React Native & `react-native-svg`:** `lucide-react-native` requires `react-native-svg` installed in peer dependencies for SVG types and JSX element color/size props to pass TypeScript checks under React 19.
- **Expo Router entry point:** When using Expo Router, ensure `package.json` specifies `"main": "expo-router/entry"` and remove any standalone root `index.ts` or `App.tsx` templates.
- **RevenueCat Sandbox:** Always build a safe fallback/sandbox simulation layer into RevenueCat services so that the app's entire paywall, entitlement unlock, and tier-gated features can be demonstrated smoothly during hackathons and development without requiring live store merchant credentials.
- **StatusBar typing:** In `expo-status-bar`, `<StatusBar style="light" />` does not take `backgroundColor` on all platforms; background color should be applied via the root container view.
- **Reanimated 4.x Android Gradle Dependency:** Under React Native 0.86 / Expo SDK 57, `react-native-reanimated` 4.5.1 strictly requires `react-native-worklets` pinned to version `0.10.0` (Worklets 0.12.x throws `assertWorkletsVersionTask` build failure).

