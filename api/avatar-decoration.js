import { getPool } from './_lib/db.js';
import { sendApiError } from './_lib/auth.js';

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = String(req.query && req.query.userId || '').trim();
  const decorationId = String(req.query && req.query.decorationId || '').trim();
  if (!validUuid(userId) || !validUuid(decorationId)) {
    return res.status(400).json({ error: 'A valid player and decoration are required.' });
  }

  try {
    const result = await getPool().query(
      `select d.image_data
         from public.player_profiles p
         join public.player_decorations d on d.id = p.active_decoration_id
        where p.user_id = $1
          and p.active_decoration_id = $2
          and d.status = $3
        limit 1`,
      [userId, decorationId, 'approved']
    );
    const dataUrl = result.rows[0] && String(result.rows[0].image_data || '');
    const match = /^data:image\/(png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
    if (!match) {
      return res.status(404).json({ error: 'This player has no active public decoration.' });
    }

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
