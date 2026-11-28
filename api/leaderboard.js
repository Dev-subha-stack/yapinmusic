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
      `select l.user_id, l.username, p.avatar_url, p.active_preset_decoration, p.active_decoration_id,\n              case when p.active_decoration_id is not null then\n                '/api/avatar-decoration?userId=' || p.user_id::text || '&decorationId=' || p.active_decoration_id::text\n              else null end as active_decoration_url,\n              l.total_points, l.wins, l.games_played, l.rank_position
         from public.player_leaderboard l
         join public.player_profiles p on p.user_id = l.user_id
        order by l.rank_position asc
        limit $1`,
      [limit]
    );
    return res.status(200).json({ entries: rows });
  } catch (error) {
    return sendApiError(res, error);
  }
}
