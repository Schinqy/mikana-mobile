-- ============================================================================
-- MIKANA DATABASE SCHEMA — V1.0
-- Run in: Supabase Dashboard ? SQL Editor ? New Query
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE 1: profiles
-- ============================================================================
create table if not exists public.profiles (
  id                   uuid        primary key references auth.users(id) on delete cascade,
  display_name         text,
  business_name        text,
  tagline              text,
  industry             text,
  phone_number         text,
  whatsapp_number      text,
  location             text        default 'Harare',
  service_areas        text[]      default array[]::text[],
  onboarding_stage     text        default 'welcome'
                                   check (onboarding_stage in ('welcome', 'discovered', 'paired', 'groups', 'completed')),
  subscription_tier    text        default 'free'
                                   check (subscription_tier in ('free', 'pro_monthly', 'pro_annual', 'agency')),
  created_at           timestamptz default timezone('utc', now()) not null,
  updated_at           timestamptz default timezone('utc', now()) not null
);

-- ============================================================================
-- TABLE 2: capabilities
-- ============================================================================
create table if not exists public.capabilities (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        references public.profiles(id) on delete cascade not null,
  title          text        not null,
  category       text        not null,
  type           text        default 'service' check (type in ('service', 'product', 'trade')),
  deliverables   text[]      default array[]::text[],
  pricing_model  text        default 'quote' check (pricing_model in ('fixed', 'hourly', 'starting_at', 'quote')),
  base_price     numeric,
  currency       text        default 'USD',
  is_active      boolean     default true,
  created_at     timestamptz default timezone('utc', now()) not null
);

-- ============================================================================
-- TABLE 3: whatsapp_sessions
-- ============================================================================
create table if not exists public.whatsapp_sessions (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        references public.profiles(id) on delete cascade not null unique,
  session_id      text        not null unique,
  phone_number    text,
  status          text        default 'disconnected'
                              check (status in ('disconnected', 'qr_pending', 'qr_ready', 'pairing_syncing', 'connected')),
  connected_at    timestamptz,
  last_heartbeat  timestamptz default timezone('utc', now()) not null,
  created_at      timestamptz default timezone('utc', now()) not null
);

-- ============================================================================
-- TABLE 4: monitored_groups
-- ============================================================================
create table if not exists public.monitored_groups (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        references public.profiles(id) on delete cascade not null,
  session_id        text        not null,
  group_jid         text        not null,
  group_name        text        not null,
  participant_count integer     default 0,
  is_monitored      boolean     default true,
  created_at        timestamptz default timezone('utc', now()) not null,
  unique (user_id, group_jid)
);

-- ============================================================================
-- TABLE 5: opportunities
-- ============================================================================
create table if not exists public.opportunities (
  id                  uuid        primary key default uuid_generate_v4(),
  session_id          text        not null,
  source_group_jid    text        not null,
  source_group_name   text        not null,
  sender_jid          text        not null,
  sender_name         text,
  sender_phone        text,
  raw_text            text        not null,
  raw_messages        text[]      default array[]::text[],
  source_message_ids  text[]      default array[]::text[],
  opportunity_type    text        not null,
  category            text        not null,
  title               text        not null,
  summary             text        not null,
  requirements        text[]      default array[]::text[],
  quantity            text,
  budget              text,
  currency            text,
  location            text,
  deadline            text,
  urgency             text        default 'medium' check (urgency in ('low', 'medium', 'urgent')),
  confidence          numeric     not null,
  detected_at         timestamptz default timezone('utc', now()) not null,
  created_at          timestamptz default timezone('utc', now()) not null
);

-- ============================================================================
-- TABLE 6: opportunity_matches
-- ============================================================================
create table if not exists public.opportunity_matches (
  id                    uuid        primary key default uuid_generate_v4(),
  opportunity_id        uuid        references public.opportunities(id) on delete cascade not null,
  user_id               uuid        references public.profiles(id) on delete cascade not null,
  match_score           integer     not null check (match_score >= 0 and match_score <= 100),
  match_reasons         jsonb       default '{}'::jsonb,
  matched_capabilities  text[]      default array[]::text[],
  notify_tier           text        check (notify_tier in ('critical', 'high', 'medium', 'low')),
  stage                 text        default 'captured'
                                    check (stage in ('captured', 'viewed', 'pitched', 'responded', 'won', 'lost', 'ignored')),
  pitch_draft           text,
  created_at            timestamptz default timezone('utc', now()) not null,
  unique (opportunity_id, user_id)
);

-- ============================================================================
-- TABLE 7: subscriptions
-- ============================================================================
create table if not exists public.subscriptions (
  id                      uuid        primary key default uuid_generate_v4(),
  user_id                 uuid        references public.profiles(id) on delete cascade not null unique,
  tier                    text        default 'free' check (tier in ('free', 'pro_monthly', 'pro_annual', 'agency')),
  revenuecat_customer_id  text,
  status                  text        default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     default false,
  updated_at              timestamptz default timezone('utc', now()) not null
);

-- ============================================================================
-- TABLE 8: usage_meters
-- ============================================================================
create table if not exists public.usage_meters (
  id                     uuid        primary key default uuid_generate_v4(),
  user_id                uuid        references public.profiles(id) on delete cascade not null,
  billing_cycle          text        not null,
  messages_scanned       integer     default 0,
  l1_evaluations         integer     default 0,
  l3_extractions         integer     default 0,
  opportunities_matched  integer     default 0,
  pitches_generated      integer     default 0,
  autopilot_replies_sent integer     default 0,
  created_at             timestamptz default timezone('utc', now()) not null,
  unique (user_id, billing_cycle)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_capabilities_user     on public.capabilities(user_id) where is_active = true;
create index if not exists idx_groups_user           on public.monitored_groups(user_id) where is_monitored = true;
create index if not exists idx_opportunities_date    on public.opportunities(detected_at desc);
create index if not exists idx_matches_radar         on public.opportunity_matches(user_id, stage, match_score desc);
create index if not exists idx_usage_cycle           on public.usage_meters(user_id, billing_cycle);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles             enable row level security;
alter table public.capabilities         enable row level security;
alter table public.whatsapp_sessions    enable row level security;
alter table public.monitored_groups     enable row level security;
alter table public.opportunity_matches  enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.usage_meters         enable row level security;

create policy "profiles_self"     on public.profiles             for all using (auth.uid() = id);
create policy "caps_self"         on public.capabilities         for all using (auth.uid() = user_id);
create policy "sessions_self"     on public.whatsapp_sessions    for all using (auth.uid() = user_id);
create policy "groups_self"       on public.monitored_groups     for all using (auth.uid() = user_id);
create policy "matches_read_self" on public.opportunity_matches  for select using (auth.uid() = user_id);
create policy "matches_update"    on public.opportunity_matches  for update using (auth.uid() = user_id);
create policy "subs_read_self"    on public.subscriptions        for select using (auth.uid() = user_id);
create policy "usage_read_self"   on public.usage_meters         for select using (auth.uid() = user_id);

-- ============================================================================
-- AUTO-PROFILE TRIGGER (fires on every new Supabase Auth signup)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, onboarding_stage, subscription_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'welcome',
    'free'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
