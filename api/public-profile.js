import { getPool } from './_lib/db.js';
import { sendApiError } from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = String(req.query && req.query.userId || '').trim();
  if (!userId || userId.length > 128) {
    return res.status(400).json({ error: 'A valid player ID is required.' });
  }

  try {
    const { rows } = await getPool().query(
      `select p.user_id, p.username, p.bio, p.avatar_url, p.banner_url,
              p.yapin_username, p.yapin_display_name, p.yapin_verified_at,
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
    if (!rows[0]) return res.status(404).json({ error: 'This player profile could not be found.' });
    return res.status(200).json({ profile: rows[0] });
  } catch (error) {
    return sendApiError(res, error);
  }
}
