-- Extend public player cards with optional customisation.
alter table public.player_profiles add column if not exists bio text not null default '';
alter table public.player_profiles add column if not exists avatar_url text;
alter table public.player_profiles add column if not exists banner_url text;
