import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { userId } = await requireNeonUser(req);
    await getPool().query(
      'insert into public.player_presence (user_id, last_seen) values ($1, now()) on conflict (user_id) do update set last_seen = excluded.last_seen',
      [userId]
    );
    return res.status(200).json({ online: true });
  } catch (error) {
    return sendApiError(res, error);
  }
}
