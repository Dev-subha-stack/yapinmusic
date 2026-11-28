-- Built-in profile decoration selections.
alter table public.player_profiles
  add column active_preset_decoration text;
alter table public.player_profiles
  add constraint player_profiles_active_preset_decoration_check
  check (active_preset_decoration is null or active_preset_decoration in (
    'neon-orbit',
    'ember-ring',
    'starlight',
    'sakura-bloom',
    'frostline',
    'emerald-leaves'
  ));
