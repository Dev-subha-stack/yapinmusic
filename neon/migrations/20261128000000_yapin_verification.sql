-- Link a verified Yapin identity to an existing Yapin Music account.
-- OAuth state is short-lived and stored server-side; access tokens are never persisted.
alter table public.player_profiles
  add column if not exists yapin_user_id uuid,
  add column if not exists yapin_username text,
  add column if not exists yapin_display_name text,
  add column if not exists yapin_verified_at timestamptz;

create unique index if not exists player_profiles_yapin_user_id_uidx
  on public.player_profiles (yapin_user_id)
  where yapin_user_id is not null;

create table if not exists public.yapin_oauth_states (
  state_hash text primary key,
  user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists yapin_oauth_states_expires_at_idx
  on public.yapin_oauth_states (expires_at);
