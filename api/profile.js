import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';

function validUsername(value) {
  const username = String(value || '').trim();
  return /^[\p{L}\p{N}_. -]{3,24}$/u.test(username) ? username : null;
}

function validBio(value) {
  const bio = String(value || '').trim();
  if (bio.length > 160) return null;
  return bio;
}

function validTagline(value) {
  const tagline = String(value || '').trim();
  return tagline.length <= 60 ? tagline : null;
}

function validAccentColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : null;
}

function validChoice(value, choices) {
  const choice = String(value || '').trim();
  return choices.includes(choice) ? choice : null;
}

function validImageData(value, maxLength) {
  if (value == null || value === '') return null;
  const image = String(value).trim();
  if (image.length > maxLength) return null;
  // Profile images are accepted only as compressed file data from the upload control.
  // External image links are intentionally not supported.
  return /^data:image\/(?:png|apng|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(image) ? image : null;
}

async function readProfile(pool, userId) {
  const { rows } = await pool.query(
    `select p.user_id, p.username, p.bio, p.tagline, p.avatar_url, p.banner_url,
            p.accent_color, p.card_style, p.avatar_shape, p.profile_effect,
            p.yapin_username,
            coalesce(l.total_points, 0)::integer as total_points,
            coalesce(l.wins, 0)::integer as wins,
            coalesce(l.games_played, 0)::integer as games_played,
            l.rank_position
       from public.player_profiles p
       left join public.player_leaderboard l on l.user_id = p.user_id
      where p.user_id = $1
      limit 1`,
    [userId]
  );
  return rows[0] || null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { userId } = await requireNeonUser(req);
    const pool = getPool();
    if (req.method === 'GET') {
      return res.status(200).json({ profile: await readProfile(pool, userId) });
    }

    const body = req.body || {};
    const username = validUsername(body.username);
    if (!username) {
      return res.status(400).json({
        error: 'Choose a public name with 3–24 letters, numbers, spaces, dots, dashes or underscores.'
      });
    }
    const bio = validBio(body.bio);
    const hasTagline = Object.prototype.hasOwnProperty.call(body, 'tagline');
    const hasAccentColor = Object.prototype.hasOwnProperty.call(body, 'accentColor');
    const hasCardStyle = Object.prototype.hasOwnProperty.call(body, 'cardStyle');
    const hasAvatarShape = Object.prototype.hasOwnProperty.call(body, 'avatarShape');
    const hasProfileEffect = Object.prototype.hasOwnProperty.call(body, 'profileEffect');
    const tagline = hasTagline ? validTagline(body.tagline) : null;
    const accentColor = hasAccentColor ? validAccentColor(body.accentColor) : null;
    const cardStyle = hasCardStyle ? validChoice(body.cardStyle, ['classic', 'sunset', 'ocean', 'aurora', 'midnight']) : null;
    const avatarShape = hasAvatarShape ? validChoice(body.avatarShape, ['circle', 'rounded', 'square']) : null;
    const profileEffect = hasProfileEffect ? validChoice(body.profileEffect, ['none', 'glow', 'shimmer']) : null;
    const hasAvatar = Object.prototype.hasOwnProperty.call(body, 'avatarData');
    const hasBanner = Object.prototype.hasOwnProperty.call(body, 'bannerData');
    const avatarData = hasAvatar ? validImageData(body.avatarData, 1400000) : null;
    const bannerData = hasBanner ? validImageData(body.bannerData, 1850000) : null;
    if (bio == null) return res.status(400).json({ error: 'Your bio must be 160 characters or fewer.' });
    if (hasTagline && tagline == null) return res.status(400).json({ error: 'Your one-line status must be 60 characters or fewer.' });
    if (hasAccentColor && accentColor == null) return res.status(400).json({ error: 'Choose a valid profile accent colour.' });
    if (hasCardStyle && cardStyle == null) return res.status(400).json({ error: 'Choose one of the available profile themes.' });
    if (hasAvatarShape && avatarShape == null) return res.status(400).json({ error: 'Choose one of the available avatar shapes.' });
    if (hasProfileEffect && profileEffect == null) return res.status(400).json({ error: 'Choose one of the available profile effects.' });
    if (hasAvatar && body.avatarData && !avatarData) return res.status(400).json({ error: 'The profile photo could not be processed. Choose a JPG, PNG, WebP or GIF image and try again.' });
    if (hasBanner && body.bannerData && !bannerData) return res.status(400).json({ error: 'The banner could not be processed. Choose a JPG, PNG, WebP or GIF image and try again.' });

    await pool.query(
      `insert into public.player_profiles
         (user_id, username, bio, avatar_url, banner_url, tagline, accent_color, card_style, avatar_shape, profile_effect)
       values
         ($1, $2, $3, $4, $5, coalesce($6, ''), coalesce($7, '#FF6B35'),
          coalesce($8, 'classic'), coalesce($9, 'rounded'), coalesce($10, 'none'))
       on conflict (user_id) do update
         set username = excluded.username,
             bio = excluded.bio,
             avatar_url = coalesce(excluded.avatar_url, public.player_profiles.avatar_url),
             banner_url = coalesce(excluded.banner_url, public.player_profiles.banner_url),
             tagline = coalesce($6, public.player_profiles.tagline),
             accent_color = coalesce($7, public.player_profiles.accent_color),
             card_style = coalesce($8, public.player_profiles.card_style),
             avatar_shape = coalesce($9, public.player_profiles.avatar_shape),
             profile_effect = coalesce($10, public.player_profiles.profile_effect),
             updated_at = now()`,
      [userId, username, bio, avatarData, bannerData, tagline, accentColor, cardStyle, avatarShape, profileEffect]
    );
    return res.status(200).json({ profile: await readProfile(pool, userId) });
  } catch (error) {
    if (error && error.code === '23505') {
      error.statusCode = 409;
      error.message = 'That public player name is already in use.';
    }
    return sendApiError(res, error);
  }
}
