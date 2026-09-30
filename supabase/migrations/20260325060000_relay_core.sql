-- RELAY — schéma privacy-first
-- Aucun email / téléphone / nom réel dans public.profiles
-- Auth Supabase utilise un email technique username@relay.local (jamais exposé UI)

create extension if not exists "pgcrypto";
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null,
  accent text not null default '#f2c14e',
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null
    check (game_id in ('pulse-snake', 'echo-memory', 'drift-breaker')),
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists scores_game_score_idx on public.scores (game_id, score desc);
create index if not exists profiles_username_idx on public.profiles (username);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "friendships_select_participants" on public.friendships;
create policy "friendships_select_participants"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "friendships_delete_participants" on public.friendships;
create policy "friendships_delete_participants"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "scores_select_authenticated" on public.scores;
create policy "scores_select_authenticated"
  on public.scores for select
  to authenticated
  using (true);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own"
  on public.scores for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  insert into public.profiles (id, username, display_name)
  values (new.id, uname, uname)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon;
revoke all on function private.handle_new_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
