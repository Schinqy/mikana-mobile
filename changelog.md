# Changelog

All notable changes to **Mikana Mobile** are documented here.

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
