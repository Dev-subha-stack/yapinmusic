-- Store daily rewards independently and include them in leaderboard point totals.
create table if not exists public.player_point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  source text not null check (source in ('daily_bonus', 'mission')),
  source_key text not null,
  points integer not null check (points between 1 and 1000),
  event_date date not null,
  created_at timestamptz not null default now(),
  constraint player_point_events_one_claim unique (user_id, source_key)
);

create index if not exists player_point_events_user_date_idx
  on public.player_point_events (user_id, event_date desc);

alter table public.player_point_events enable row level security;

create or replace view public.player_leaderboard
with (security_invoker = true) as
with game_totals as (
  select user_id, coalesce(sum(score), 0)::integer as game_points,
         count(*)::integer as games_played,
         count(*) filter (where won)::integer as wins,
         count(*) filter (where not won)::integer as losses
    from public.game_scores group by user_id
),
reward_totals as (
  select user_id, coalesce(sum(points), 0)::integer as reward_points
    from public.player_point_events group by user_id
),
totals as (
  select p.user_id, p.username,
         (coalesce(g.game_points, 0) + coalesce(r.reward_points, 0))::integer as total_points,
         coalesce(g.games_played, 0)::integer as games_played,
         coalesce(g.wins, 0)::integer as wins,
         coalesce(g.losses, 0)::integer as losses
    from public.player_profiles p
    left join game_totals g on g.user_id = p.user_id
    left join reward_totals r on r.user_id = p.user_id
),
ranked as (
  select totals.*,
         row_number() over (order by total_points desc, wins desc, username asc)::integer as rank_position
    from totals
)
select user_id, username, total_points, games_played, wins, losses, rank_position
  from ranked
 where games_played > 0 or total_points > 0;
