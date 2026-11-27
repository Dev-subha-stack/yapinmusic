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

function validImage(value, maxLength) {
  if (value == null || value === '') return null;
  const image = String(value).trim();
  if (image.length > maxLength) return null;
  if (/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(image)) return image;
  try {
    const url = new URL(image);
    return url.protocol === 'https:' && url.hostname ? image : null;
  } catch {
    return null;
  }
}

async function readProfile(pool, userId) {
  const { rows } = await pool.query(
    `select p.user_id, p.username, p.bio, p.avatar_url, p.banner_url,
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
    const avatarUrl = validImage(body.avatarUrl, 950000);
    const bannerUrl = validImage(body.bannerUrl, 1850000);
    if (bio == null) return res.status(400).json({ error: 'Your bio must be 160 characters or fewer.' });
    if (body.avatarUrl && !avatarUrl) return res.status(400).json({ error: 'Use a secure image URL or upload a PNG, JPG or WebP image smaller than 700 KB after compression.' });
    if (body.bannerUrl && !bannerUrl) return res.status(400).json({ error: 'Use a secure image URL or upload a PNG, JPG or WebP banner smaller than 1.3 MB after compression.' });

    await pool.query(
      `insert into public.player_profiles (user_id, username, bio, avatar_url, banner_url)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id) do update
         set username = excluded.username,
             bio = excluded.bio,
             avatar_url = excluded.avatar_url,
             banner_url = excluded.banner_url,
             updated_at = now()`,
      [userId, username, bio, avatarUrl, bannerUrl]
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
