ALTER TABLE public.player_profiles
DROP CONSTRAINT IF EXISTS player_profiles_active_preset_decoration_check;
ALTER TABLE public.player_profiles
ADD CONSTRAINT player_profiles_active_preset_decoration_check
CHECK (
  active_preset_decoration IS NULL OR active_preset_decoration = ANY (ARRAY[
    'neon-orbit', 'ember-ring', 'starlight', 'sakura-bloom', 'frostline', 'emerald-leaves',
    'aurora-halo', 'royal-amethyst', 'solar-flare', 'sakura-royale',
    'ocean-crown', 'cyber-prism', 'celestial-rose', 'emerald-empress'
  ]::text[])
);
