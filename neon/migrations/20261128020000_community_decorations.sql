-- Community avatar decorations and active-player presence for Yapin Music.
create table if not exists public.player_decorations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.player_profiles(user_id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 32),
  image_data text not null check (char_length(image_data) between 100 and 360000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  review_note text not null default '',
  reviewed_by uuid references public.player_profiles(user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_decorations_status_created_idx
  on public.player_decorations (status, created_at desc);
create index if not exists player_decorations_creator_status_idx
  on public.player_decorations (creator_id, status, created_at desc);

alter table public.player_profiles
  add column if not exists active_decoration_id uuid
    references public.player_decorations(id) on delete set null;
create index if not exists player_profiles_active_decoration_idx
  on public.player_profiles (active_decoration_id)
  where active_decoration_id is not null;

create table if not exists public.player_presence (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  last_seen timestamptz not null default now()
);
create index if not exists player_presence_last_seen_idx
  on public.player_presence (last_seen desc);

alter table public.player_decorations enable row level security;
alter table public.player_presence enable row level security;
