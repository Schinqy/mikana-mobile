# Changelog

All notable changes to **Mikana Mobile** are documented here.

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
