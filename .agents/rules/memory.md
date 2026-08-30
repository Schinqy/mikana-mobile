# Mikana Mobile — Workspace Memory & Architectural Decisions

## Project Profile
- **Application:** Mikana Mobile
- **Core Mission:** Autonomous AI Opportunity Radar & Instant Proposal Dispatch Engine for Service Providers, Freelancers, and Merchants.
- **Competition Target:** Ship-a-ton (RevenueCat Hackathon)

## Key Technical Decisions
1. **Design Engineering Standard:**
   - Dark-first aesthetic inspired by Linear, Raycast, and Vercel Geist.
   - Zero-emoji policy across buttons, badges, status pills, and headers. Vector Lucide icons with 1.5–2px stroke widths are used exclusively.
   - Hairline borders (`#27272a`), subtle elevation (`#121215`, `#18181b`), crisp typography contrast.
2. **State & Persistence:**
   - Zustand stores with `@react-native-async-storage/async-storage` middleware for offline readiness and state preservation across launches.
3. **Monetization Engine (RevenueCat):**
   - Package: `react-native-purchases`
   - Entitlement ID: `mikana_pro`
   - Tiers: `pro_monthly` ($9.99/mo), `pro_annual` ($79/yr), `agency_monthly` ($24.99/mo), `boost_10` ($2.99 consumable).
   - Includes full Sandbox & Demo Switch for instantaneous live walkthroughs during judging and testing.
4. **Autonomous 24/7 Offline Autopilot:**
   - Background lead matcher and pitch engine for Pro/Agency tiers.
   - Configurable confidence threshold (e.g. 80%+), daily caps (e.g. 15 replies/day), and auto-dispatch audit logs.
5. **AI Proposal Engine:**
   - Powered by Google Gemini active models (`gemini-2.5-flash`).
   - Multimodal OCR / Text lead qualification, budget estimation, urgency classification, and contextual WhatsApp DM quote synthesis grounded in the seller's catalog.
