# Changelog

All notable changes to **Mikana Mobile** are documented here.

## [1.6.0] - 2026-09-04

### Onboarding Expansion: Notifications, Paywall & 6-Stage Stepper
- **Strict NativeWind v4 Workspace Rule & UI Rebuild (`groups.tsx` & `.agent/rules/general-rules.md`):** Formalized strict rule prohibiting legacy `StyleSheet.create` across all UI code. Rebuilt `groups.tsx` completely in NativeWind v4 with verified Android Hermes-compatible utility classes, eliminating `CssInterop` runtime crashes while delivering clean, elevated group cards.
- **WhatsApp Group Detection Fix (`groups.tsx` & `server/index.js`):** Resolved 404 session lookup failure by standardizing session key to `session_user_default` and normalizing server route handlers. Mapped Baileys `subject` and `participants` fields and added automated 2-second retry loops to accommodate initial multi-device chat sync lag right after QR scanning.
- **Relay Monitored Groups Synchronization (`groups.tsx`):** Added `setMonitoredGroups` dispatch on group confirmation so the active Baileys socket immediately whitelists the user's chosen trade channels.
- **Anti-Reset Storage Hydration Guard (`index.tsx` & `useAuthStore.ts`):** Added `_hasHydrated` gating to prevent app launch race conditions from prematurely redirecting returning authenticated users back to the welcome screen before `AsyncStorage` completes rehydration.
- **Resilient Connection Persistence (`index.tsx`):** Protected WhatsApp connected status against accidental wipes on network timeouts or server cold-starts; status only resets on explicit `logged_out` or `disconnected` events.
- **Language Country Flags (`discover.tsx`):** Added country and regional flag icons to all 44+ international and African languages in both the searchable dropdown menu and selected language badge chips.
- **Categorized Match Trigger Dictionary (`discover.tsx`):** Structured AI-generated capability keywords into 3 distinct operational buckets: *Buyer Intent Signals*, *Specifications & Packaging Units*, and *Trade Vernacular & Offerings*.
- **Unified 6-Stage Progress Stepper:** Harmonized top progress indicators across all onboarding steps (1. Welcome, 2. Discover, 3. Pair, 4. Groups, 5. Notifications, 6. Paywall) with stage 2 sub-progress bar.
- **Secondary Phone Number Pairing (`pair.tsx`):** Maintained 8-digit multi-device phone pairing as a dedicated secondary tab alongside primary QR scanner, with zero skip traps to protect group sync reliability.
- **Speak-Inspired Story Flow (`welcome.tsx`):** Redesigned the welcome screen with horizontal back-and-forth swiping, breathing ambient blue corner aura, royal blue text accents, and skip action.
- **Instant Alerts Screen (`notifications.tsx`):** Added Step 5 onboarding screen demonstrating sub-second RFQ interception via a tactile push notification mockup card. Integrates `expo-notifications` permissions request with graceful fallback and a skip option.
- **Freemium Paywall Screen (`paywall.tsx`):** Added Step 6 onboarding paywall highlighting **Mikana Free ("No Credit Card Required")** as the default zero-risk choice alongside an optional **Mikana Pro (7-Day Trial)** upgrade. Supports one-tap free enrollment and RevenueCat Pro purchases.
- **No-Trap Channel Selection (`groups.tsx`):** Added 8-second fetch timeout with AbortController, retry/refresh button, and a clean empty state with actionable instructions. Transitions seamlessly to `/onboarding/notifications`.
- **Smart Location Disambiguation (`discover.tsx`):** Selecting specific regional hubs or custom locations automatically clears the "Worldwide / Remote" fallback tag and vice versa.
- **Zero-Emoji & Anti-Fake Controls:** Removed all placeholder/fake speech-to-text elements and verified clean, accessible UI controls across all onboarding steps.

### Conversational Onboarding, Supabase Schema & AuthGate Routing
- **4-Stage Value-First Onboarding:** Replaced login-gate-first approach with value-first conversational onboarding. Users see the WhatsApp→Radar transformation demo before any credential prompt.
- **Stage 1 — Welcome (`welcome.tsx`):** Staggered animated hero screen showing raw WhatsApp noise converting to a 96% match Radar card. No credentials required to proceed.
- **Stage 2 — Adaptive Discovery (`discover.tsx`):** 3-step conversational flow: free-text description → real-time Gemini AI chip extraction (categories, capabilities) → location picker. Handles Shona, Ndebele, and English code-switching natively.
- **Stage 3 — Dual-Mode Pairing (`pair.tsx`):** 8-digit pairing code as primary method (no camera required). QR code as graceful fallback. 60-second countdown with auto-expire and one-tap code copy.
- **Stage 4 — Group Whitelist (`groups.tsx`):** Fetches live WhatsApp groups from relay. 2-group free tier gate triggers paywall on selection of group #3.
- **AuthGate Routing (`_layout.tsx`):** `AuthGate` component auto-redirects first-time users to onboarding and returning users to `/(tabs)` based on `onboardingCompleted` in persisted store.
- **`useAuthStore`:** New Zustand store managing Supabase session, `onboardingStage`, `onboardingCompleted`, and `capabilityProfile`. Persisted to AsyncStorage (session re-fetched from Supabase on mount).
- **Supabase Schema (`supabase/schema.sql`):** Complete 8-table DDL — `profiles`, `capabilities`, `whatsapp_sessions`, `monitored_groups`, `opportunities`, `opportunity_matches`, `subscriptions`, `usage_meters`. Full RLS policies. `handle_new_user` trigger auto-creates profile + subscription rows on Auth sign-up.

## [1.4.0] - 2026-09-02

### 5-Layer Opportunity Detection Pipeline
- **Layer 0 (Local Noise Gate):** Drops reactions, stickers, emoji-only messages, and WhatsApp noise patterns (greetings, one-word responses) in 0ms with pure regex.
- **Layer 1 (Cheap AI Gate):** `gemini-2.0-flash-lite` binary opportunity classifier. Conservative drop threshold — only rejects if >75% confident the message is NOT an opportunity (recall bias to avoid false negatives).
- **Layer 2 (Context Grouper):** 60-second configurable debounce window groups fragmented messages from the same sender (*"Anyone know a plumber?" + "In Borrowdale" + "Today"*) into a single context.
- **Layer 3 (Full Extraction):** `gemini-2.0-flash` extracts structured opportunity JSON: type, category, title, summary, requirements, quantity, budget, location, deadline, urgency, confidence.
- **Layer 4 (Capability Matching):** Local TypeScript engine matches extracted opportunity against user's capability profile using configurable per-type weights (category, capability, product, location, keywords).
- **Layer 5 (Notification Tiers):** `critical/high/medium/low` tiers. Only surfaces matches above threshold via `broadcastToSession`.
- **Opportunity ↔ Lead Shim:** Backward-compatible `opportunityToLead()` mapper ensures existing app WebSocket listeners (`new_lead` events) continue working.
- **Deduplication Engine:** FNV-style hash deduplication with configurable 30-minute window per group.
- **AutoPilot Hook:** Architecture stub ready for V2 auto-response generation.
- **`pushCapabilityProfile` (relay client):** App pushes compact capability profile to relay on WhatsApp connect so matching is personalized from first message.
- **`/api/metrics` endpoint:** Relay exposes pipeline counters, Gemini token usage, and estimated USD cost.

## [1.3.0] - 2026-09-01


### WhatsApp Phone Pairing, Country Detection & Typography Fixes
- **WhatsApp Phone Number Pairing:** Replaced camera QR dependency with real 8-digit multi-device phone pairing (`sock.requestPairingCode`) for single-device self-pairing.
- **195+ Country Database & Auto-Detection:** Built `src/utils/countryCodes.ts` with timezone auto-detection (`Africa/Harare` $\rightarrow$ `🇿🇼 +263`) and safe-area inset padded modal selector.
- **Resolved Android Font Truncation:** Mapped `fonts.geist` on Android to `Inter` font weights (`Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) to eliminate Android native OTF advance-width bounding box clipping across all buttons, headings, and tab labels.
- **Dynamic LAN Relay Resolution:** Dynamically extracts Metro host IP from `expo-constants` for seamless Wi-Fi connection from physical mobile devices.
- **Keyboard Avoidance:** Integrated `KeyboardAwareScrollView` from `react-native-keyboard-controller` to prevent keyboard overlay during phone number entry.

## [1.2.0] - 2026-08-31

### Navigation, Typography & Architecture Refactor
- **3-Tab Navigation Architecture:** Streamlined 5 tabs down to 3 focused tabs (`Home`, `Deals`, `Business`) with custom top-indicator tab bar and dynamic active item expansion.
- **Geist & Inter Typography System:** Integrated `@expo-google-fonts/geist` for UI chrome, headings, and numbers, alongside `@expo-google-fonts/inter` for body copy and descriptions. Defined strict type scale in `src/theme/fonts.ts`.
- **Dual-Blue Palette Lock:** Locked **Royal Blue (`#1E56A0`)** for interactive CTAs & active states alongside **Midnight Navy (`#0B2545`)** for headers and dark surfaces.
- **FlashList Performance:** Upgraded Home inquiry feed from `FlatList` to `@shopify/flash-list` for smooth 60fps scrolling.
- **Business Hub:** Created `app/(tabs)/business.tsx` consolidating WhatsApp multi-device status, product offerings, 24/7 Autopilot toggles, and Pro subscriptions.
- **Live Emulator Verification:** Verified all 3 tabs running live on Android emulator `Pixel_4a`.

## [1.1.0] - 2026-08-30

### Brand & Design Transformation (Mikana Identity System)
- **Midnight Navy Brand Theme:** Redesigned the entire application to the official Mikana Brand guidelines featuring Midnight Navy (`#0B2545`), Royal Blue (`#1E56A0`), soft off-white canvas (`#F8FAFC`), and crisp white surfaces (`#FFFFFF`).
- **Anti-Slop & Craft Standards:** Enforced user's `anti-slop-expo` and `mobile-ui-review` design skills across all screens:
  - Stripped decorative badge overload and heavy drop shadows in favor of 1px hairline borders (`#E2E8F0`).
  - Implemented high-contrast typography hierarchy (`#0B2545` primary text, `#486581` secondary text).
  - Modernized `Button`, `Card`, `Badge`, `Input`, and `LeadFilterBar` components.
- **Screen Updates:** Redesigned Radar Feed (`index.tsx`), Deal Pipeline CRM (`pipeline.tsx`), Autopilot 24/7 Engine (`autopilot.tsx`), Service Catalog (`catalog.tsx`), Settings (`settings.tsx`), Proposal Studio (`pitch.tsx`), New Lead Ingestion (`new-lead.tsx`), and RevenueCat Paywall (`paywall.tsx`).
- **Android Simulator & Development Build:** Booted `Pixel_4a` emulator and configured direct development builds via ADB.

## [1.0.0] - 2026-08-30

### Added
- **Bootstrap:** Initialized Expo SDK 57 project with React Native 0.86, Expo Router v4, and NativeWind v4.
- **Lead Radar:** Real-time lead interception feed with match scores (`96% Match`), urgency filters, search bar, and incoming lead simulation.
- **AI Pitch Studio:** Powered by Google Gemini active models (`gemini-2.5-flash`) for automated sales proposals and 1-tap WhatsApp DM dispatch.
- **24/7 Offline Autopilot:** Autonomous background lead qualification and quote responder for Pro/Agency tiers with safety score thresholds and daily reply caps.
- **Deal Pipeline CRM:** Visual stage columns (*Captured $\rightarrow$ Quoted $\rightarrow$ Negotiating $\rightarrow$ Won*) with active pipeline valuation metrics.
- **Catalog Management:** Service catalog, pricing models, deliverables, and business profile for grounding AI pitches.
- **Monetization (RevenueCat):** Integrated `react-native-purchases` with Pro Monthly ($9.99), Pro Annual ($79.99), and Agency ($24.99) tiers, plus Sandbox demo mode.
- **Type Safety:** 100% strict TypeScript compilation passing with 0 errors.
