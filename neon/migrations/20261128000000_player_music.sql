-- Add an optional, manually curated music section to public player cards.
alter table public.player_profiles
  add column if not exists music_profile jsonb not null
    default '{"recentTrack":null,"favoriteTracks":[],"playlists":[]}'::jsonb;

alter table public.player_profiles
  add column if not exists music_is_public boolean not null default false;
