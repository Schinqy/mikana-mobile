# Mikana Mobile — Project Memory

> This file contains PERMANENT, high-value context. It is NOT a status tracker.
> Check this file at the start of every session before proposing any changes.
> Update it when something architecturally important is confirmed or disproven.

---

## 1. Project Profile & Purpose

- **Application:** Mikana Mobile
- **Purpose:** Autonomous AI Business Lead Interceptor & WhatsApp Proposal Dispatcher for service providers, contractors, freelancers, and merchants.
- **Competition Target:** Ship-a-ton (RevenueCat Global Mobile Hackathon)
- **Repo / Path:** `e:\Code\mikana-mobile`

---

## 2. Architecture & Tech Stack

- **Framework:** Expo SDK 57 (React Native 0.86+, Expo Router v4)
- **Styling:** NativeWind v4 (Tailwind CSS) with strict dark-first design engineering standards
- **Icons:** `lucide-react-native` (paired with `react-native-svg`)
- **State Management:** Zustand stores with `@react-native-async-storage/async-storage` persistence
- **Monetization (RevenueCat):** `react-native-purchases` (Pro Monthly $9.99, Pro Annual $79.99, Agency $24.99, Consumable $2.99)
- **AI Proposal Engine:** Google Gemini active models (`gemini-2.5-flash` / `gemini-2.5-pro`)
- **24/7 Offline Autopilot:** Background lead scoring and autonomous WhatsApp quote dispatching (Pro tier feature)

---

## 3. Critical File Paths

| Purpose | Path |
| :--- | :--- |
| Agent rules | `.agent/rules/code-execution.md` + `.agent/rules/general-rules.md` |
| Permanent context | `memory.md` |
| Historical lessons (append-only) | `lessons.md` |
| Release milestones | `changelog.md` |
| Lead Radar feed | `app/(tabs)/index.tsx` |
| Deal Pipeline CRM | `app/(tabs)/pipeline.tsx` |
| 24/7 Offline Autopilot | `app/(tabs)/autopilot.tsx` |
| Service Catalog & Profile | `app/(tabs)/catalog.tsx` |
| Settings & API Integrations | `app/(tabs)/settings.tsx` |
| AI Pitch Studio modal | `app/modal/pitch.tsx` |
| RevenueCat Paywall modal | `app/modal/paywall.tsx` |
| Gemini AI service | `src/services/ai/geminiExtractor.ts` |
| RevenueCat SDK service | `src/services/purchases/revenueCat.ts` |
| WhatsApp Deep Link dispatcher | `src/services/dispatcher/whatsappDeepLink.ts` |

---

## 4. HARD NEVER DOs

- **Never use `&&` in PowerShell** — always use `;` (PowerShell 5.x does not support `&&`).
- **Never overwrite `lessons.md`** — it is strictly append-only.
- **Never use emojis in UI controls** (buttons, badges, tabs, headers, status pills). Always use Lucide icons.
- **Never use heavy drop shadows on dark surfaces** — use 1px hairline borders (`#27272a`) and surface elevation (`#121215`, `#18181b`).
- **Never commit `.env` or raw API keys** to version control.
- **Never delete important source files** without explicit user confirmation.
