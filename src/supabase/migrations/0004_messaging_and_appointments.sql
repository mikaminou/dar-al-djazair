-- =====================================================================
-- 0004_messaging_and_appointments.sql
-- =====================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz,
  status text not null default 'open' check (status in ('open','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, seeker_id, owner_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  read_at timestamptz,
  delivered_at timestamptz,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  start_at timestamptz not null,
  end_at   timestamptz not null,
  capacity int not null default 1,
  recurring jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  proposed_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled','completed')),
  counter_proposal_of uuid references public.appointments(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);