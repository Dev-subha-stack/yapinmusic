import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';
import { requireYapinAdmin } from './_lib/admin.js';

const REVIEW_REASONS = new Set([
  'Not original artwork',
  'Avatar safe area is not clear',
  'Not aligned with the avatar or cut off',
  'Not light at the bottom',
  'Too small or blurry',
  'Contains nudity, gore, or hate',
  'Other'
]);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

async function readDashboard(pool) {
  const results = await Promise.all([
    pool.query('select count(*)::integer as total_users from neon_auth."user"'),
    pool.query("select count(*)::integer as online_users from public.player_presence where last_seen >= now() - interval '5 minutes'"),
    pool.query("select count(*)::integer as pending_count from public.player_decorations where status = 'pending'"),
    pool.query("select count(*)::integer as approved_count from public.player_decorations where status = 'approved'"),
    pool.query("select d.id, d.name, d.image_data, d.creator_id, d.created_at, p.username as creator_username, p.avatar_url as creator_avatar from public.player_decorations d join public.player_profiles p on p.user_id = d.creator_id where d.status = 'pending' order by d.created_at asc limit 50")
  ]);
  return {
    stats: {
      totalUsers: Number(results[0].rows[0].total_users) || 0,
      onlineUsers: Number(results[1].rows[0].online_users) || 0,
      pendingDecorations: Number(results[2].rows[0].pending_count) || 0,
      approvedDecorations: Number(results[3].rows[0].approved_count) || 0
    },
    pending: results[4].rows
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await requireNeonUser(req);
    requireYapinAdmin(user);
    if (req.method === 'GET') {
      if (String(req.query && req.query.scope || '') === 'access') {
        return res.status(200).json({ isAdmin: true });
      }
      return res.status(200).json(await readDashboard(getPool()));
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const body = req.body || {};
    const action = String(body.action || '');
    const decorationId = String(body.decorationId || '');
    if (!validUuid(decorationId)) throw badRequest('Choose a valid decoration.');

    if (action === 'approve') {
      const result = await getPool().query(
        "update public.player_decorations set status = 'approved', review_note = '', reviewed_by = $2, reviewed_at = now(), updated_at = now() where id = $1 and status = 'pending' returning id",
        [decorationId, user.userId]
      );
      if (!result.rowCount) throw badRequest('This submission is no longer waiting for review.');
      return res.status(200).json({ approved: true });
    }

    if (action === 'reject') {
      const reason = String(body.reason || '').trim();
      const note = String(body.note || '').trim();
      if (!REVIEW_REASONS.has(reason)) throw badRequest('Choose a rejection reason.');
      const reviewNote = reason + (note ? ': ' + note : '');
      if (reviewNote.length > 180) throw badRequest('The review note must be 180 characters or fewer.');
      const result = await getPool().query(
        "update public.player_decorations set status = 'rejected', review_note = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now() where id = $1 and status = 'pending' returning id",
        [decorationId, reviewNote, user.userId]
      );
      if (!result.rowCount) throw badRequest('This submission is no longer waiting for review.');
      return res.status(200).json({ rejected: true });
    }

    if (action === 'take-down') {
      const result = await getPool().query(
        "update public.player_decorations set status = 'removed', review_note = 'Removed by an administrator.', reviewed_by = $2, reviewed_at = now(), updated_at = now() where id = $1 and status = 'approved' returning id",
        [decorationId, user.userId]
      );
      if (!result.rowCount) throw badRequest('This decoration is no longer available.');
      await getPool().query(
        'update public.player_profiles set active_decoration_id = null, updated_at = now() where active_decoration_id = $1',
        [decorationId]
      );
      return res.status(200).json({ removed: true });
    }

    throw badRequest('Choose a valid moderation action.');
  } catch (error) {
    return sendApiError(res, error);
  }
}
