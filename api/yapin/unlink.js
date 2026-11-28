import { getPool } from '../_lib/db.js';
import { requireNeonUser, sendApiError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { userId } = await requireNeonUser(req);
    const pool = getPool();
    await pool.query(
      `update public.player_profiles
          set yapin_user_id = null,
              yapin_username = null,
              yapin_display_name = null,
              yapin_verified_at = null,
              updated_at = now()
        where user_id = $1`,
      [userId]
    );
    await pool.query('delete from public.yapin_oauth_states where user_id = $1', [userId]);
    return res.status(200).json({ unlinked: true });
  } catch (error) {
    return sendApiError(res, error);
  }
}
