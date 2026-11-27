import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';

function validUsername(value) {
  const username = String(value || '').trim();
  return /^[\p{L}\p{N}_. -]{3,24}$/u.test(username) ? username : null;
}

async function readProfile(pool, userId) {
  const { rows } = await pool.query(
    `select p.user_id, p.username,
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
    const username = validUsername(req.body && req.body.username);
    if (!username) {
      return res.status(400).json({
        error: 'Choose a public name with 3–24 letters, numbers, spaces, dots, dashes or underscores.'
      });
    }
    await pool.query(
      `insert into public.player_profiles (user_id, username)
       values ($1, $2)
       on conflict (user_id) do update
         set username = excluded.username, updated_at = now()`,
      [userId, username]
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
