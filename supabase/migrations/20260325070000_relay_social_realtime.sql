-- RELAY social + realtime + recovery (mirror of applied Gaming migration)

alter table public.profiles
  add column if not exists avatar text not null default '◆',
  add column if not exists last_seen_at timestamptz not null default now();

create table if not exists public.recovery_codes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_no_self check (sender_id <> recipient_id)
);

create index if not exists messages_pair_idx
  on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);

create table if not exists public.party_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  status text not null default 'open' check (status in ('open', 'playing', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.party_members (
  room_id uuid not null references public.party_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.party_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.party_rooms (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint party_invites_no_self check (from_id <> to_id)
);

create index if not exists party_invites_to_idx on public.party_invites (to_id, status);
