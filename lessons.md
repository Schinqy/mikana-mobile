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

### [2026-09-01] Baileys WhatsApp Relay Architecture
- **Baileys cannot run inside React Native JS thread.** `@whiskeysockets/baileys` requires Node.js crypto sockets and persistent TCP WebSocket connections. It MUST run as a separate Node.js server process (relay). The mobile app connects to the relay via HTTP REST + WebSocket.
- **Every WhatsApp-based mobile CRM** (Respond.io, Wati, etc.) uses the same relay architecture. This is not a limitation — it is the standard.
- **printQRInTerminal is deprecated** in recent Baileys versions. Listen to `connection.update` event for QR strings and handle them yourself (stream to mobile via WebSocket).
- **Multi-session support:** Each user gets their own Baileys session stored in `server/.auth_sessions/<session_id>/`. Auth credentials persist across restarts via `useMultiFileAuthState`.
- **Railway deployment:** Use `Dockerfile` with `node:20-slim` base image. Attach a persistent volume at `/app/.auth_sessions` to persist WhatsApp auth across deploys.
- **Supabase Realtime for instant lead push:** Enable `ALTER PUBLICATION supabase_realtime ADD TABLE leads;` so the mobile app receives new leads instantly via Supabase Realtime subscriptions without polling.
- **Never build dummy QR codes** — always wire real Baileys QR generation from Day 1. Dummy pairing flows waste time and create false confidence in the product.

### [2026-09-01] Android React Native Custom Font Advance-Width Truncation Bug
- **`@expo-google-fonts/geist` on Android Native Text Engine:** The font metric tables in Geist cause Android's native `TextView`/Yoga measurement engine to calculate the horizontal advance width narrower than the actual glyph bounding box. This causes the last 1–2 characters to be clipped on all bold/medium text nodes (`Account` -> `Accou`, `Code` -> `Cod`, `Home` -> `Hom`, `Scanner` -> `Scanne`).
- **Solution:** Map `fonts.geist` on Android to `Inter` font family weights (`Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) via `src/theme/fonts.ts` while keeping Geist on iOS. Inter has robust, balanced font bounding box metrics and renders with zero character truncation on Android.

### [2026-09-01] Baileys 8-Digit Pairing Code & Physical Device Networking
- **`usePairingCode: true` is Mandatory for Phone Number Pairing:** In `@whiskeysockets/baileys`, calling `sock.requestPairingCode(phoneNumber)` will hang indefinitely or fail if `makeWASocket` is initialized in the default QR scanning mode. Sockets intended for phone number pairing MUST be explicitly configured with `usePairingCode: true` and `printQRInTerminal: false`.
- **Physical USB Device Networking (`adb reverse`):** Connecting physical Android devices to a local Node.js relay server over Wi-Fi LAN (`10.x.x.x` / `192.168.x.x`) frequently fails due to Windows Firewall rules, subnet routing, or router AP isolation. Always execute `adb reverse tcp:3005 tcp:3005` during development so `localhost:3005` on the phone tunnels directly to the host PC.
- **Network Timeout Guarding:** Always wrap multi-device socket generation network calls with an `AbortController` (e.g. 25-second ceiling) to give clear user feedback rather than allowing mobile UI spinners to hang indefinitely during socket handshakes.
