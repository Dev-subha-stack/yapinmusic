-- Yapin Music: initial database foundation (not applied automatically).
-- Apply only after creating a Supabase project and reviewing the security notes
-- in README.md. Score writes should eventually be routed through a trusted RPC
-- or Edge Function so clients cannot award themselves arbitrary points.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_mode text not null check (game_mode in ('song', 'band')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  score integer not null default 0 check (score >= 0),
  won boolean not null default false,
  guesses_used integer not null default 0 check (guesses_used >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  puzzle_date date,
  created_at timestamptz not null default now()
);

create index if not exists game_scores_leaderboard_idx
  on public.game_scores (game_mode, difficulty, score desc, created_at asc);
create index if not exists game_scores_user_idx
  on public.game_scores (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.game_scores enable row level security;

-- Public profiles are needed to render public leaderboard names.
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Signed-in players may read public scores and submit only scores for themselves.
create policy "Scores are readable by everyone"
  on public.game_scores for select
  using (true);

create policy "Users submit their own scores"
  on public.game_scores for insert
  with check (auth.uid() = user_id);

-- Aggregate leaderboard view: one best score per player/game/difficulty.
create or replace view public.leaderboard
with (security_invoker = true) as
select
  s.game_mode,
  s.difficulty,
  p.id as user_id,
  p.username,
  p.avatar_url,
  max(s.score) as best_score,
  count(*)::integer as games_played,
  max(s.created_at) as last_played_at
from public.game_scores s
join public.profiles p on p.id = s.user_id
group by s.game_mode, s.difficulty, p.id, p.username, p.avatar_url;
