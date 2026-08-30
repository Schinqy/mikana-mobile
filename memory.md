# Mikana Mobile — Project Memory

> This file contains PERMANENT, high-value context. It is NOT a status tracker.
> Check this file at the start of every session before proposing any changes.
> Update it when something architecturally important is confirmed or disproven.

---

## 1. Project Profile & Purpose

- **Application:** Mikana Mobile
- **Tagline:** *Mikana — Where Opportunities Meet You.*
- **Purpose:** Fast-response lead capture & WhatsApp quote dispatcher for SMEs, product merchants, contractors, and service providers. Helps businesses win deals by reaching buyer inquiries across WhatsApp channels in under 5 minutes.
- **Competition Target:** RevenueCat Ship-a-ton 2026 Mobile Hackathon (Deadline: Sept 30, 2026)
- **Repo / Path:** `e:\Code\mikana-mobile`

---

## 2. Brand Identity & Design System

- **Primary Brand Color:** **Midnight Navy (`#0B2545` / `#07182E`)** from official Mikana Brand Guidelines (Concept 1 Pathway M & Concept 2 Open Door).
- **Secondary Accent:** **Royal Blue (`#1E56A0`)** for interactive active states and focus borders.
- **Theme Paradigm:** **Clean, High-Craft Light Mode** (Things 3 / Linear / Stripe benchmark).
  - Background Canvas: `#F8FAFC` (soft off-white).
  - Surfaces / Cards: `#FFFFFF` (pure crisp white).
  - Hairline Borders: `1px solid #E2E8F0` / `#CBD5E1`.
  - Primary Text: `#0B2545` (high-contrast deep navy).
  - Secondary Text: `#486581` (steel slate).
  - Action Buttons: Solid `#0B2545` with crisp `#FFFFFF` typography.
- **Strict Anti-Slop Enforcement:** Rules defined in `anti-slop-expo` and `mobile-ui-review` skills (Zero emojis in UI buttons/badges/headers, no cards-inside-cards, realistic SME buyer inquiries).

---

## 3. Architecture & Tech Stack

- **Framework:** Expo SDK 57 (React Native 0.86+, Expo Router v4)
- **Native Engine:** React Native New Architecture + Reanimated 4.5.1 (`react-native-worklets@0.10.0`)
- **Icons:** `lucide-react-native` (paired with `react-native-svg`)
- **State Management:** Zustand stores with `@react-native-async-storage/async-storage` persistence
- **Monetization (RevenueCat):** `react-native-purchases` (Pro Monthly $9.99, Pro Annual $79.99, Agency $24.99, Consumable $2.99)
- **AI Proposal Engine:** Google Gemini (`gemini-2.5-flash` / `gemini-3.5-flash-lite`)
- **24/7 Offline Autopilot:** Background lead scoring and autonomous WhatsApp proposal dispatching (Pro tier feature)

---

## 4. Critical File Paths

| Purpose | Path |
| :--- | :--- |
| Brand Color & Tokens | `src/theme/colors.ts` |
| Agent rules | `.agent/rules/code-execution.md` + `.agent/rules/general-rules.md` |
| Anti-Slop Skills | `C:\Users\shing\.gemini\config\skills\anti-slop-expo\SKILL.md` |
| Permanent context | `memory.md` |
| Historical lessons | `lessons.md` |
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

## 5. HARD NEVER DOs

- **Never use `&&` in PowerShell** — always use `;` (PowerShell 5.x does not support `&&`).
- **Never overwrite `lessons.md`** — it is strictly append-only.
- **Never use emojis in UI controls** (buttons, badges, tabs, headers, status pills). Always use Lucide icons.
- **Never use dark mode defaults** — use the official Mikana Midnight Navy light theme (`#0B2545`, `#F8FAFC`, `#FFFFFF`, `#E2E8F0`).
- **Never commit `.env` or raw API keys** to version control.
- **Never delete important source files** without explicit user confirmation.
