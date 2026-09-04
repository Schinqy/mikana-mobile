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

### [2026-09-01] Baileys 515 Handshake Timing & "Couldn't Link Device" Fix
- **WhatsApp 515 Restart Handshake:** When WhatsApp accepts an 8-digit pairing code, it transmits auth keys and immediately closes the socket with status `515` (`DisconnectReason.restartRequired`) expecting the server to reconnect instantly.
- **The Timeout Trap:** If the server uses standard backoff delays (e.g. 3000ms `setTimeout`), the WhatsApp client on the phone times out (strict ~1.5s tolerance) and aborts with *"Couldn't link device"*.
- **The Fix:** Explicitly check for `statusCode === 515` or `DisconnectReason.restartRequired` in `connection.update` and invoke `startBaileysSession(sessionId, userId, false)` immediately with **0ms delay**, while suppressing the disconnect broadcast to the UI.

### [2026-09-01] Baileys Pre-Auth 401 Credential Preservation
- **The Pre-Auth 401 Trap:** When generating an 8-digit pairing code, WhatsApp's servers emit `statusCode: 401` during the initial challenge before the user types the code.
- **The Bug:** If the server interprets all `401` status codes as a user logout and deletes `authPath`, the session keys generated for the pairing code are deleted immediately, making the code invalid before the user can type it into WhatsApp.
- **The Fix:** Only treat `401` as a logout if the session was previously authenticated (`session.wasConnected === true`). During the pairing phase, keep credentials intact and maintain the reconnect loop.

### [2026-09-04] WhatsApp Multi-Device Session Keys & Group Detection Sync
- **Session Key Mismatch Trap:** Baileys sessions registered on the server as `session_${userId}` (e.g. `session_user_default`) return 404 when requested via `/api/sessions/user_default/groups`. Both client endpoints and relay route handlers MUST normalize `fullSessionId = sessionId.startsWith('session_') ? sessionId : `session_${sessionId}`` to guarantee unified session discovery across onboarding and business hub.
- **WhatsApp Multi-Device Initial Sync Grace Period:** Immediately after QR scanning or 8-digit code completion, the Baileys socket establishes `connection: open`, but WhatsApp takes 2–4 seconds to stream group rosters and participant metadata. Calling `groupFetchAllParticipating()` instantly at second 0.1 returns empty arrays. Adding automated 2s retry intervals with user-facing sync feedback resolves false-positive "No groups detected" states.
- **Storage Hydration Guarding Against "Back to Zero":** Zustand `persist` rehydration from `AsyncStorage` is asynchronous. Routing engines (`app/index.tsx`) must guard against premature evaluation using `_hasHydrated`. If routing runs while `_hasHydrated === false`, initial state defaults (`onboardingStage: 'welcome', onboardingCompleted: false`) trigger premature redirects to the welcome screen.
- **Resilient Connection Persistence:** Never reset `isWhatsAppConnected(false)` inside generic network catch blocks (such as when a cloud relay is cold-starting or cellular drops). Connection status should only be reset on explicit server logout or session termination events (`logged_out`, `disconnected`).

### [2026-09-04] Asynchronous Rehydration Race Conditions & Real-Time Form Persistence
- **The `useState(store.value)` Initialization Trap:** Zustand `persist` stores backed by `AsyncStorage` load asynchronously. When a screen mounts on reload, `useState(store.profile)` synchronously evaluates with empty initial store defaults before `AsyncStorage` has finished rehydrating. When rehydration completes 20ms later, `useState` does not re-evaluate, leaving form inputs (and checked items) appearing blank. Submitting or navigating then overwrites persisted storage with empty values. Always attach a reactive `useEffect([storeValue])` to synchronize local form state as soon as rehydrated data arrives.
- **Real-Time Checkbox Persistence:** For multi-selection lists (such as monitored WhatsApp groups), do not defer store persistence exclusively to the final "Submit" button. Persisting every checkbox toggle to the Zustand store in real time ensures that reloads, app backgrounding, or back-navigation immediately remember all user selections.
- **NativeWind v4 CSS Interop Safety on Hermes:** Avoid web-only arbitrary color opacity modifiers (e.g. `bg-brand-blue-tint/60`, `border-brand-blue-border/60`) and transitions (`transition-all`). On Android Hermes, `react-native-css-interop` throws fatal runtime render crashes when encountering non-standard classes, severing the React Navigation tree. Stick to standard design tokens defined in `tailwind.config.js`.

### [2026-09-04] Paywall UX & Action Directness Anti-Pattern
- **The "Dead Card" Selection Anti-Pattern:** Never rely on detached radio-card selection paradigms where tapping a subscription card merely toggles an internal state variable while the action button sits separated at the bottom of the viewport or off-screen. Users naturally interpret an inactive card tap as a broken or "dummy" interface. Each membership tier card MUST feature its own explicit, prominent action CTA (e.g. `[ Activate Pro — $9.99 / month → ]` and `[ Continue with Free Tier ($0) → ]`) that immediately triggers the transaction and navigates forward.
- **Billing Transparency Over Copy Confusion:** Never mix conflicting billing propositions on a single card (such as "$9.99 / month (or $79.99/yr)" paired with a detached button saying "Start Pro (7-Day Trial)"). Provide an explicit, toggleable segmented control for billing cycles (`Monthly · $9.99/mo` vs `Annual · $79.99/yr · Save 35%`) so the user always knows the exact duration and charge before confirming.
- **Graceful Sandbox Simulation Fallback:** In development builds or hackathon environments where Google Play / App Store live merchant billing is unavailable, always provide an instant, non-blocking fallback to activate Pro in Sandbox Mode so users and judges can test and experience premium features without transaction crashes.

### [2026-09-04] Permission Flow Idempotency & Confirmed Active States
- **The Redundant Permission Prompt Trap:** Never render a permission request screen with an unconditional "Enable" CTA without first querying `getPermissionsAsync()` or persisted settings on mount. If the operating system or user already granted permissions in an earlier interaction, navigating back or reloading into the step must immediately display a confirmed "Notifications Active" state with a direct `"Continue"` CTA. Blindly calling `requestPermissionsAsync()` on an already-granted permission frustrates users by making them feel trapped in an endless loop of asking to accept again.

### [2026-09-04] WhatsApp Multi-Device Group Detection Resilience & Relay Session Recovery
- **The Ephemeral Relay Cold-Start & In-Memory Session Disconnect Trap:** Cloud relays running on ephemeral or free tiers (e.g., Render free instances) wipe in-memory session maps upon container restart or after 15 minutes of inactivity. Calling `/api/sessions/:sessionId/groups` on a dead or cold session returns 404 or hangs indefinitely if Baileys is in a connecting state. Always add `ensureSessionReady()` on the client to re-awaken sessions and wrap group socket queries in `Promise.race` timeouts with background pre-caching.
- **Never Trap Users in Empty "No Groups Detected" Dead-Ends:** If a live group fetch returns empty or the relay drops, never render a blank dead-end that forces users to wonder why detection failed. Always:
  1. Detect session disconnects and display an actionable "WhatsApp Session Offline" card with a 1-tap `[ Re-link Device ]` button routing directly back to pairing.
  2. Synthesize and preserve any previously saved `radarChannels` as selectable chips so the user's progress is never reset to zero.
  3. Provide an inline manual channel entry field (`[ + Add Group Name ]`) so users can type and monitor trade groups directly without blocking onboarding progress.

### [2026-09-04] Onboarding Offerings Pipeline & Unified Screen Navigation Craft
- **The Onboarding Extraction Disconnect Anti-Pattern:** When users enter business details and products during onboarding, never discard or only partially store the extracted offerings in temporary step state. Always immediately instantiate them as active offerings in `useCatalogStore` (`services`) and sync `location`, `serviceAreas`, and `languages` so the Catalog and Business hub instantly reflect the user's setup upon completing onboarding.
- **Header & Navigation Uniformity Standard:** Sub-screens navigated from bottom tabs (such as `catalog.tsx`, `settings.tsx`, and `business-profile.tsx`) must never omit a standard top-bar back button (`ArrowLeft` or `X`). Navigating to a sub-screen without a clear, prominent back action traps users and breaks physical navigation flow.
- **Anti-Dummy Metric Transparency:** Never hardcode mock analytics (e.g. `$17,150` pipeline value, `3.8 min` speed) on the main dashboard feed. Always compute metrics dynamically from live user leads, falling back to clean "Radar Active & Listening" radar states when no inquiries have arrived yet.



