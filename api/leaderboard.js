import { getPool } from './_lib/db.js';
import { sendApiError } from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const parsed = Number.parseInt(String(req.query && req.query.limit || '100'), 10);
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : 100;
    const { rows } = await getPool().query(
      'select user_id, username, total_points, wins, games_played, rank_position from public.player_leaderboard order by rank_position asc limit $1',
      [limit]
    );
    return res.status(200).json({ entries: rows });
  } catch (error) {
    return sendApiError(res, error);
  }
}
