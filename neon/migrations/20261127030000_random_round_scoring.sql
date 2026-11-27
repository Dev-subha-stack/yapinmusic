-- Separate one-per-day Daily results from repeatable, uniquely identified Random rounds.
alter table public.game_scores
  add column round_type text not null default 'daily'
  check (round_type in ('daily', 'random'));

alter table public.game_scores
  add column round_id text;

alter table public.game_scores
  drop constraint if exists game_scores_one_daily_result;

create unique index game_scores_one_daily_result_idx
  on public.game_scores (user_id, game_mode, difficulty, puzzle_date)
  where round_type = 'daily';

create unique index game_scores_one_random_round_idx
  on public.game_scores (user_id, round_id)
  where round_type = 'random' and round_id is not null;
