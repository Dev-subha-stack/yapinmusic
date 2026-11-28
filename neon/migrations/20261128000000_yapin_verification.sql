-- Yapin OAuth login for Yapin Music.
-- Yapin identity is a login provider; email/password login remains enabled in Neon Auth.
alter table public.player_profiles
  add column if not exists yapin_user_id text,
  add column if not exists yapin_username text,
  add column if not exists yapin_display_name text,
  add column if not exists yapin_verified_at timestamptz;

alter table public.player_profiles
  alter column yapin_user_id type text using yapin_user_id::text;

create unique index if not exists player_profiles_yapin_user_id_uidx
  on public.player_profiles (yapin_user_id)
  where yapin_user_id is not null;

create table if not exists public.yapin_oauth_states (
  state_hash text primary key,
  user_id uuid references public.player_profiles(user_id) on delete cascade,
  code_verifier text not null,
  flow text not null default 'login',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.yapin_oauth_states alter column user_id drop not null;
alter table public.yapin_oauth_states
  add column if not exists flow text not null default 'login';

create index if not exists yapin_oauth_states_expires_at_idx
  on public.yapin_oauth_states (expires_at);
create index if not exists yapin_oauth_states_flow_idx
  on public.yapin_oauth_states (flow, expires_at);
