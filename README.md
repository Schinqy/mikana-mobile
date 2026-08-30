# Mikana Mobile — AI Opportunity Radar & Instant Proposal Dispatcher
### *Built for Ship-a-ton (Powered by RevenueCat & Google Gemini)*

**Mikana Mobile** is an autonomous mobile application built for service providers, contractors, freelancers, and merchants. It continuously monitors incoming buying requests across business channels (WhatsApp groups, classifieds, forums), evaluates and scores deal potential in real-time via **Google Gemini AI**, and generates tailored, high-converting WhatsApp DM proposals grounded in the user's active service catalog with 1-tap dispatch.

---

## Key Capabilities

- **Real-Time Lead Radar**: Intercepts buying requests and RFQs across business channels with match scoring (0–100%) and urgency tags.
- **AI Pitch Studio**: Leverages Google Gemini active models (`gemini-2.5-flash` / `gemini-2.5-pro`) to synthesize custom sales proposals formatted for instant WhatsApp DM transmission.
- **Deal Pipeline CRM**: Visual deal stage tracker (*Captured -> Quoted -> Negotiating -> Won*) with real-time pipeline valuation analytics.
- **24/7 Offline Autopilot (Pro / Agency Tier)**: Autonomous background responder that scores incoming leads and dispatches quotes according to safety thresholds and daily reply limits.
- **Dynamic Service Catalog**: Manage service offerings, rate cards (fixed/hourly), turnaround guarantees, and portfolio links used to ground AI proposals.
- **RevenueCat Monetization Engine**: Integrated `react-native-purchases` supporting Pro Monthly ($9.99/mo), Pro Annual ($79.99/yr), Agency ($24.99/mo), and Consumable Boosts ($2.99), with full Sandbox demo mode for hackathon judging.
- **Linear/Raycast Design Craft**: Precision dark-first interface adhering to high-density standards, hairline borders (`#27272a`), zero emoji pollution, and native tactile haptics.

---

## Tech Stack & Architecture

- **Framework**: Expo SDK 57 (React Native 0.86+, Expo Router v4)
- **Styling**: NativeWind v4 (Tailwind CSS) + Precision Dark Design System
- **State Management**: Zustand with `@react-native-async-storage/async-storage` persistence
- **Monetization**: RevenueCat SDK (`react-native-purchases`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` with dynamic fallback)
- **Icons & Native APIs**: `lucide-react-native`, `react-native-svg`, `expo-haptics`, `expo-clipboard`, `expo-linking`

---

## Getting Started

### 1. Prerequisites & Installation
```bash
# Clone and enter directory
cd mikana-mobile

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Run the App
```bash
# Start Expo development server
npx expo start

# Run on Android emulator / device
npx expo start --android

# Run on iOS simulator (macOS)
npx expo start --ios

# Run on Web browser
npx expo start --web
```

---

## RevenueCat & Ship-a-ton Judging Walkthrough

Mikana Mobile includes an interactive Sandbox / Demo mode so judges and testers can immediately test all Pro and Agency tier features without requiring live store credentials.

1. **Access Paywall**:
   - Tap the **Upgrade** badge on the top header, or navigate to **Settings** (`/settings`) and open the **Paywall Modal** (`/modal/paywall`).
2. **Review Tiers**:
   - Compare **Pro Trader** ($9.99/mo) and **Agency** ($24.99/mo) plans.
3. **Simulate Purchase**:
   - In Sandbox Mode, tap **Unlock Now (Demo / Sandbox)**. Pro entitlements activate immediately with haptic confirmation.
4. **Test Gated Features**:
   - Navigate to the **Autopilot** tab (`/autopilot`): notice the 24/7 Offline Auto-Reply engine and safety threshold sliders are now unlocked.
   - Dispatch custom pitches in the **AI Pitch Studio** (`/modal/pitch`) without weekly lead quota limitations.
5. **Live Production Mode**:
   - In **Settings**, toggle off Sandbox Mode and paste your production RevenueCat Public API Key (`appl_...` or `goog_...`) to connect directly to the RevenueCat backend.

---

## Project Structure

```
mikana-mobile/
├── .agent/rules/                  # Anti-slop, code execution & general rules
├── .agents/rules/                 # Memory, lessons & conventional commit guidelines
├── app/                           # Expo Router v4 navigation structure
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Dark bottom tab navigation bar
│   │   ├── index.tsx              # Lead Radar Stream & Simulation Trigger
│   │   ├── pipeline.tsx           # Deal Pipeline CRM & Valuation
│   │   ├── autopilot.tsx          # 24/7 Offline Autopilot Manager (Pro)
│   │   ├── catalog.tsx            # Services & Rate Card Management
│   │   └── settings.tsx           # Gemini AI Key, WhatsApp & RevenueCat
│   ├── modal/
│   │   ├── pitch.tsx              # AI Pitch Studio & WhatsApp DM Dispatch
│   │   ├── paywall.tsx            # RevenueCat Subscriptions Paywall
│   │   └── new-lead.tsx           # Manual / Paste Opportunity Scanner
│   └── _layout.tsx                # Root Providers & Zustand Rehydration
├── src/
│   ├── components/
│   │   ├── ui/                    # Base components: Button, Badge, Card, Input, Header
│   │   ├── radar/                 # LeadCard, LeadFilterBar, ScoreMeter
│   │   ├── pipeline/              # DealCard, StageSelector
│   │   └── paywall/               # PricingCard, FeatureChecklist
│   ├── store/
│   │   ├── useLeadStore.ts        # Opportunity storage, stages & filters
│   │   ├── useCatalogStore.ts     # Business profile & service catalogue
│   │   ├── useAutopilotStore.ts   # 24/7 Auto-reply thresholds & audit logs
│   │   ├── useSubscriptionStore.ts# RevenueCat customer info & tiers
│   │   └── useSettingsStore.ts    # AI API keys & radar preferences
│   ├── services/
│   │   ├── ai/
│   │   │   └── geminiExtractor.ts # Active Gemini Flash lead scoring & pitch synthesis
│   │   ├── purchases/
│   │   │   └── revenueCat.ts      # RevenueCat SDK wrapper & demo fallbacks
│   │   └── dispatcher/
│   │       └── whatsappDeepLink.ts# WhatsApp DM deep-links & dialer
│   └── types/
│       ├── lead.ts
│       ├── catalog.ts
│       ├── autopilot.ts
│       └── subscription.ts
├── memory.md                      # Permanent architectural context
├── lessons.md                     # Append-only engineering log
├── changelog.md                   # Versioned release log
├── tailwind.config.js             # NativeWind dark theme design tokens
├── global.css                     # Baseline CSS tokens
└── app.json                       # Expo configuration
```

---

## License

Built for the **Ship-a-ton Mobile Hackathon 2026**.
