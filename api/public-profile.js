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
    const pool = getPool();
    const profileSql = [
      'select p.user_id, p.username, p.bio, p.active_decoration_id, p.active_preset_decoration,',
      'd.name as active_decoration_name, d.image_data as active_decoration_image,',
      "exists (select 1 from public.player_decorations ad where ad.creator_id = p.user_id and ad.status = 'approved') as artist_badge,",
      'p.tagline, p.avatar_url, p.banner_url, p.accent_color, p.card_style, p.avatar_shape, p.profile_effect,',
      'coalesce(l.total_points, 0)::integer as total_points, coalesce(l.wins, 0)::integer as wins,',
      'coalesce(l.games_played, 0)::integer as games_played, l.rank_position',
      'from public.player_profiles p',
      'left join public.player_leaderboard l on l.user_id = p.user_id',
      "left join public.player_decorations d on d.id = p.active_decoration_id and d.status = 'approved'",
      'where p.user_id = $1 limit 1'
    ].join(' ');
    const profileResult = await pool.query(profileSql, [userId]);
    if (!profileResult.rows[0]) return res.status(404).json({ error: 'This player profile could not be found.' });

    const decorationsSql = [
      'select d.id, d.name, d.image_data, count(w.user_id)::integer as wearer_count',
      'from public.player_decorations d',
      'left join public.player_profiles w on w.active_decoration_id = d.id',
      "where d.creator_id = $1 and d.status = 'approved'",
      'group by d.id order by d.created_at desc limit 12'
    ].join(' ');
    const decorationsResult = await pool.query(decorationsSql, [userId]);
    const profile = profileResult.rows[0];
    profile.created_decorations = decorationsResult.rows;
    return res.status(200).json({ profile });
  } catch (error) {
    return sendApiError(res, error);
  }
}
