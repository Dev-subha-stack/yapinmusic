-- Yapin Music: optional accounts and a public daily leaderboard.
-- Apply this migration to a dedicated YapinMusic Supabase project.
-- Public clients may read rankings and manage their own profile, but can never
-- insert or alter game scores directly. Only the authenticated Edge Function
-- writes scores using its server-side service key.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
create unique index if not exists game_scores_one_daily_result_idx
  on public.game_scores (user_id, game_mode, difficulty, puzzle_date)
  where puzzle_date is not null;

alter table public.profiles enable row level security;
alter table public.game_scores enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Scores are readable by everyone" on public.game_scores;
create policy "Scores are readable by everyone"
  on public.game_scores for select
  to anon, authenticated
  using (true);

-- Remove the old draft's direct client insert policy. Browser clients must
-- submit only through the authenticated submit-score Edge Function.
drop policy if exists "Users submit their own scores" on public.game_scores;
revoke insert, update, delete on public.game_scores from anon, authenticated;
grant select on public.profiles, public.game_scores to anon, authenticated;
grant insert, update on public.profiles to authenticated;

create or replace view public.player_leaderboard
with (security_invoker = true) as
with totals as (
  select
    p.id as user_id,
    p.username,
    coalesce(sum(s.score), 0)::integer as total_points,
    count(s.id)::integer as games_played,
    count(s.id) filter (where s.won)::integer as wins,
    count(s.id) filter (where not s.won)::integer as losses
  from public.profiles p
  left join public.game_scores s on s.user_id = p.id
  group by p.id, p.username
),
ranked as (
  select
    totals.*,
    dense_rank() over (order by total_points desc, wins desc, username asc) as rank_position
  from totals
)
select user_id, username, total_points, games_played, wins, losses, rank_position
from ranked
where games_played > 0;

grant select on public.player_leaderboard to anon, authenticated;
