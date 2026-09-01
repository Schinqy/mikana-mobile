-- Mikana Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ─── WhatsApp Sessions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_pending')),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Leads (Incoming WhatsApp Inquiries) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_avatar_url TEXT,
  channel_name TEXT NOT NULL,
  channel_jid TEXT,
  category TEXT DEFAULT 'General',
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'urgent')),
  budget_estimate TEXT,
  location TEXT,
  match_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  extracted_needs JSONB DEFAULT '[]'::jsonb,
  matched_service_id TEXT,
  stage TEXT DEFAULT 'captured' CHECK (stage IN ('captured', 'quoted', 'negotiating', 'won', 'lost', 'archived')),
  quoted_amount NUMERIC,
  generated_pitch TEXT,
  currency TEXT DEFAULT 'USD',
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'telegram', 'manual', 'classified')),
  is_autopilot_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Services (Business Catalog) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC,
  pricing_model TEXT DEFAULT 'fixed' CHECK (pricing_model IN ('fixed', 'hourly', 'per_unit', 'custom')),
  turnaround_time TEXT,
  key_deliverables JSONB DEFAULT '[]'::jsonb,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Business Profile ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  tagline TEXT,
  contact_name TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  website TEXT,
  custom_pitch_guidelines TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_urgency ON leads(urgency);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON whatsapp_sessions(user_id);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
-- Enables Supabase Realtime so the mobile app gets instant push on new leads

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sessions;

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Users can only read/write their own data

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own rows
CREATE POLICY "Users read own leads" ON leads FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users insert own leads" ON leads FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users update own leads" ON leads FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users read own services" ON services FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users manage own services" ON services FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users read own profile" ON business_profiles FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users manage own profile" ON business_profiles FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users read own sessions" ON whatsapp_sessions FOR SELECT USING (user_id = auth.uid()::text);

-- Service role bypass (for relay server writes)
CREATE POLICY "Service role full access leads" ON leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sessions" ON whatsapp_sessions FOR ALL USING (auth.role() = 'service_role');
