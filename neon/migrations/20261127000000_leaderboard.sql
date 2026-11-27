-- Yapin Music leaderboard schema for Neon Managed Better Auth.
-- User identity and sessions are owned by Neon Auth.
create table if not exists public.player_profiles (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  username text not null check (char_length(btrim(username)) between 3 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists player_profiles_username_ci_idx
  on public.player_profiles (lower(username));

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  game_mode text not null check (game_mode in ('song', 'band')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  score integer not null default 0 check (score >= 0),
  won boolean not null default false,
  guesses_used integer not null default 0 check (guesses_used >= 0),
  puzzle_date date not null,
  created_at timestamptz not null default now(),
  constraint game_scores_one_daily_result unique (user_id, game_mode, difficulty, puzzle_date)
);

create index if not exists game_scores_leaderboard_idx
  on public.game_scores (score desc, created_at asc);
create index if not exists game_scores_user_idx
  on public.game_scores (user_id, created_at desc);

alter table public.player_profiles enable row level security;
alter table public.game_scores enable row level security;

create or replace view public.player_leaderboard
with (security_invoker = true) as
with totals as (
  select
    p.user_id,
    p.username,
    coalesce(sum(s.score), 0)::integer as total_points,
    count(s.id)::integer as games_played,
    (count(s.id) filter (where s.won))::integer as wins,
    (count(s.id) filter (where not s.won))::integer as losses
  from public.player_profiles p
  left join public.game_scores s on s.user_id = p.user_id
  group by p.user_id, p.username
),
ranked as (
  select
    totals.*,
    row_number() over (order by total_points desc, wins desc, username asc)::integer as rank_position
  from totals
)
select user_id, username, total_points, games_played, wins, losses, rank_position
from ranked
where games_played > 0;
