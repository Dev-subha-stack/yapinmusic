import { getPool } from '../_lib/db.js';
import { requireNeonUser, sendApiError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { userId, claims, provider } = await requireNeonUser(req);
    if (provider !== 'yapin' || claims.provider !== 'yapin') {
      return res.status(401).json({ error: 'No Yapin session.' });
    }
    const { rows } = await getPool().query(
      `select p.user_id, p.username, p.bio,
              p.active_decoration_id, d.name as active_decoration_name, d.image_data as active_decoration_image,
            exists (select 1 from public.player_decorations ad where ad.creator_id = p.user_id and ad.status = 'approved') as artist_badge, p.avatar_url, p.banner_url,
              coalesce(l.total_points, 0)::integer as total_points,
              coalesce(l.wins, 0)::integer as wins,
              coalesce(l.games_played, 0)::integer as games_played,
              l.rank_position, p.yapin_username
         from public.player_profiles p
         left join public.player_leaderboard l on l.user_id = p.user_id
       left join public.player_decorations d on d.id = p.active_decoration_id and d.status = 'approved'
        where p.user_id = $1
        limit 1`,
      [userId]
    );
    const profile = rows[0] || null;
    if (!profile) return res.status(401).json({ error: 'This Yapin player profile no longer exists.' });
    return res.status(200).json({
      user: {
        id: String(userId),
        name: String(claims.yapinUsername || profile.yapin_username || profile.username),
        email: null,
        provider: 'yapin',
        yapinUserId: String(claims.yapinUserId || ''),
        yapinUsername: String(claims.yapinUsername || profile.yapin_username || '')
      },
      profile
    });
  } catch (error) {
    return sendApiError(res, error);
  }
}
