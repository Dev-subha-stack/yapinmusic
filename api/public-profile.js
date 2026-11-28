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
      `select p.user_id, p.username, p.bio,
              p.active_decoration_id, d.name as active_decoration_name, d.image_data as active_decoration_image,
            exists (select 1 from public.player_decorations ad where ad.creator_id = p.user_id and ad.status = 'approved') as artist_badge, p.tagline, p.avatar_url, p.banner_url,
              p.accent_color, p.card_style, p.avatar_shape, p.profile_effect,
              coalesce(l.total_points, 0)::integer as total_points,
              coalesce(l.wins, 0)::integer as wins,
              coalesce(l.games_played, 0)::integer as games_played,
              l.rank_position
         from public.player_profiles p
         left join public.player_leaderboard l on l.user_id = p.user_id
       left join public.player_decorations d on d.id = p.active_decoration_id and d.status = 'approved'
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
