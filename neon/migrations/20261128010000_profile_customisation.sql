-- Extra appearance and identity options for Yapin Music player cards.
alter table public.player_profiles
  add column if not exists tagline text not null default '',
  add column if not exists accent_color text not null default '#FF6B35',
  add column if not exists card_style text not null default 'classic',
  add column if not exists avatar_shape text not null default 'rounded',
  add column if not exists profile_effect text not null default 'none';

alter table public.player_profiles
  add constraint player_profiles_tagline_length_check
    check (char_length(tagline) <= 60),
  add constraint player_profiles_accent_color_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint player_profiles_card_style_check
    check (card_style in ('classic', 'sunset', 'ocean', 'aurora', 'midnight')),
  add constraint player_profiles_avatar_shape_check
    check (avatar_shape in ('circle', 'rounded', 'square')),
  add constraint player_profiles_profile_effect_check
    check (profile_effect in ('none', 'glow', 'shimmer'));
