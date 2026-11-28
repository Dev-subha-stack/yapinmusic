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

  if (String(req.query && req.query.asset || '') === 'decoration') {
    const decorationId = String(req.query && req.query.decorationId || '').trim();
    const isUuid = function (value) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    };
    if (!isUuid(userId) || !isUuid(decorationId)) {
      return res.status(400).json({ error: 'A valid player and decoration are required.' });
    }
    try {
      const imageResult = await getPool().query(
        `select d.image_data
           from public.player_profiles p
           join public.player_decorations d on d.id = p.active_decoration_id
          where p.user_id = $1
            and p.active_decoration_id = $2
            and d.status = $3
          limit 1`,
        [userId, decorationId, 'approved']
      );
      const dataUrl = imageResult.rows[0] && String(imageResult.rows[0].image_data || '');
      const match = /^data:image\\/(png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
      if (!match) return res.status(404).json({ error: 'This player has no active public decoration.' });
      const image = Buffer.from(match[2], 'base64');
      if (!image.length || image.length > 270000) {
        return res.status(404).json({ error: 'This decoration image is unavailable.' });
      }
      res.setHeader('Content-Type', 'image/' + match[1].toLowerCase());
      res.setHeader('Content-Length', String(image.length));
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(image);
    } catch (error) {
      return sendApiError(res, error);
    }
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
