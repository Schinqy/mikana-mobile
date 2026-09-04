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

- **Primary Brand Colors (Dual-Blue System from Logo):**
  - **Left Pillar / Active Accent:** **Royal Blue (`#1E56A0`)** for primary CTAs, interactive highlights, and active focus.
  - **Right Pillar / Base Foundation:** **Midnight Navy (`#0B2545` / `#07182E`)** for display titles, headers, and stable dark chrome.
- **Theme Paradigm:** **Clean, High-Craft Light Mode** (Things 3 / Linear / Stripe benchmark).
  - Background Canvas: `#F8FAFC` (soft off-white).
  - Surfaces: `#FFFFFF` (crisp white).
  - Hairline Borders: `1px solid #E2E8F0` / `#CBD5E1`.
  - Primary Text: `#0B2545` (high-contrast deep navy).
  - Secondary Text: `#486581` (steel slate).
  - Typography: **Geist** (UI chrome, titles, labels, numbers) + **Inter** (body copy, descriptions).
- **Navigation Architecture (3 Focused Tabs):**
  - **Tab 1: `Home` (`index.tsx`)** — High-speed live inquiry feed + disconnected WhatsApp setup card + FlashList list rows.
  - **Tab 2: `Deals` (`pipeline.tsx`)** — Active pipeline CRM & closed revenue swimlanes.
  - **Tab 3: `Business` (`business.tsx`)** — Consolidated vertical sections for WhatsApp sync, Offerings, 24/7 Autopilot, and Subscription.
- **Strict Anti-Slop Enforcement:** Rules defined in `anti-slop-expo` and `mobile-ui-review` skills (Zero emojis in UI buttons/badges/headers, no cards-inside-cards, realistic SME buyer inquiries).

---

## 3. Architecture & Tech Stack

- **Framework:** Expo SDK 57 (React Native 0.86+, Expo Router v4)
- **Native Engine:** React Native New Architecture + Reanimated 4.5.1 (`react-native-worklets@0.10.0`)
- **Icons:** `lucide-react-native` (paired with `react-native-svg`)
- **State Management:** Zustand stores with `@react-native-async-storage/async-storage` persistence
- **Monetization (RevenueCat):** `react-native-purchases` (Pro Monthly $9.99, Pro Annual $79.99, Agency $24.99, Consumable $2.99)
- **AI Proposal Engine:** Google Gemini (`gemini-2.0-flash` / `gemini-2.5-flash`)
- **WhatsApp Engine:** `@whiskeysockets/baileys` multi-session relay (Node.js server)
- **Database:** Supabase (PostgreSQL + Realtime + Auth + RLS)
- **Deployment:** Railway (Baileys relay) + EAS Build (mobile APK/AAB)
- **24/7 Offline Autopilot:** Background lead scoring and autonomous WhatsApp proposal dispatching (Pro tier feature)

---

## 4. Production Architecture

```
Mobile App (Expo) ←→ Supabase (DB + Realtime + Auth) ←→ Baileys Relay (Railway)
                                                              ↕
                                                    WhatsApp Web Multi-Device
```

- **Real QR Pairing:** Relay generates real Baileys QR → streams to mobile via WebSocket → user scans with WhatsApp
- **Group Interception:** Relay listens to monitored WhatsApp groups → classifies with Gemini Flash → stores in Supabase → Realtime push to mobile
- **Outbound Quotes:** Mobile approves AI quote → relay sends directly through Baileys WhatsApp socket (no deep-link workaround)

---

## 5. Critical File Paths

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
| Business Hub | `app/(tabs)/business.tsx` |
| Business Profile modal | `app/modal/business-profile.tsx` |
| Products & Catalog | `app/(tabs)/catalog.tsx` |
| AI Pitch Studio modal | `app/modal/pitch.tsx` |
| RevenueCat Paywall modal | `app/modal/paywall.tsx` |
| Gemini AI service | `src/services/ai/geminiExtractor.ts` |
| RevenueCat SDK service | `src/services/purchases/revenueCat.ts` |
| WhatsApp Relay client | `src/services/relay/whatsappRelay.ts` |
| Supabase client | `src/services/supabase/client.ts` |
| **Baileys Relay Server** | `server/index.js` |
| **Supabase Schema** | `supabase/schema.sql` |
| **Railway Deploy Config** | `server/railway.json` + `server/Dockerfile` |

---

## 5. HARD NEVER DOs

- **Never use `&&` in PowerShell** — always use `;` (PowerShell 5.x does not support `&&`).
- **Never overwrite `lessons.md`** — it is strictly append-only.
- **Never use emojis in UI controls** (buttons, badges, tabs, headers, status pills). Always use Lucide icons.
- **Never use dark mode defaults** — use the official Mikana Midnight Navy light theme (`#0B2545`, `#F8FAFC`, `#FFFFFF`, `#E2E8F0`).
- **Never commit `.env` or raw API keys** to version control.
- **Never delete important source files** without explicit user confirmation.
