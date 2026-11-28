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

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
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

async function readAdmins(pool) {
  const result = await pool.query(
    'select a.user_id as "userId", u.name, u.email, a.role, a.created_at as "createdAt", grantor.email as "grantedByEmail" from public.yapin_admins a join neon_auth."user" u on u.id = a.user_id left join neon_auth."user" grantor on grantor.id = a.granted_by order by case when a.role = $1 then 0 else 1 end, lower(u.email) limit 200',
    ['owner']
  );
  return result.rows;
}

async function grantAdmin(pool, actorId, emailInput) {
  const email = String(emailInput || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('Enter a valid email address for an existing Yapin Music account.');
  }
  const target = await pool.query(
    'select id, email, name from neon_auth."user" where lower(email) = $1 limit 1',
    [email]
  );
  if (!target.rowCount) {
    throw notFound('No Yapin Music account uses that email yet. Ask the user to create an account first.');
  }
  const account = target.rows[0];
  const inserted = await pool.query(
    "insert into public.yapin_admins (user_id, role, granted_by) values ($1, 'admin', $2) on conflict (user_id) do update set role = 'admin', granted_by = excluded.granted_by where public.yapin_admins.role <> 'owner' returning user_id, role",
    [account.id, actorId]
  );
  if (!inserted.rowCount) {
    return { userId: account.id, name: account.name, email: account.email, role: 'owner', alreadyOwner: true };
  }
  return { userId: account.id, name: account.name, email: account.email, role: 'admin', alreadyAdmin: inserted.rows[0].role === 'admin' };
}

async function revokeAdmin(pool, targetId) {
  if (!validUuid(targetId)) throw badRequest('Choose a valid admin account.');
  const result = await pool.query(
    "delete from public.yapin_admins where user_id = $1 and role = 'admin' returning user_id",
    [targetId]
  );
  if (result.rowCount) return { removed: true };
  const existing = await pool.query(
    'select role from public.yapin_admins where user_id = $1 limit 1',
    [targetId]
  );
  if (existing.rows[0] && existing.rows[0].role === 'owner') {
    throw badRequest('The owner account is protected and cannot be removed.');
  }
  throw notFound('That administrator was not found or has already been removed.');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await requireNeonUser(req);
    const admin = await requireYapinAdmin(user);
    const pool = getPool();

    if (req.method === 'GET') {
      const scope = String(req.query && req.query.scope || '');
      if (scope === 'access') {
        return res.status(200).json({
          isAdmin: true,
          role: admin.adminRole,
          canManageAdmins: admin.adminRole === 'owner'
        });
      }
      if (scope === 'admins') {
        await requireYapinAdmin(user, { ownerOnly: true });
        return res.status(200).json({ admins: await readAdmins(pool) });
      }
      const dashboard = await readDashboard(pool);
      return res.status(200).json({ ...dashboard, adminRole: admin.adminRole });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const body = req.body || {};
    const action = String(body.action || '');

    if (action === 'grant-admin') {
      await requireYapinAdmin(user, { ownerOnly: true });
      const granted = await grantAdmin(pool, user.userId, body.email);
      return res.status(200).json({ admin: granted });
    }

    if (action === 'remove-admin') {
      await requireYapinAdmin(user, { ownerOnly: true });
      const result = await revokeAdmin(pool, body.userId);
      return res.status(200).json(result);
    }

    const decorationId = String(body.decorationId || '');
    if (!validUuid(decorationId)) throw badRequest('Choose a valid decoration.');

    if (action === 'approve') {
      const result = await pool.query(
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
      const result = await pool.query(
        "update public.player_decorations set status = 'rejected', review_note = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now() where id = $1 and status = 'pending' returning id",
        [decorationId, reviewNote, user.userId]
      );
      if (!result.rowCount) throw badRequest('This submission is no longer waiting for review.');
      return res.status(200).json({ rejected: true });
    }

    if (action === 'take-down') {
      const result = await pool.query(
        "update public.player_decorations set status = 'removed', review_note = 'Removed by an administrator.', reviewed_by = $2, reviewed_at = now(), updated_at = now() where id = $1 and status = 'approved' returning id",
        [decorationId, user.userId]
      );
      if (!result.rowCount) throw badRequest('This decoration is no longer available.');
      await pool.query(
        'update public.player_profiles set active_decoration_id = null, updated_at = now() where active_decoration_id = $1',
        [decorationId]
      );
      return res.status(200).json({ removed: true });
    }

    throw badRequest('Choose a valid admin action.');
  } catch (error) {
    return sendApiError(res, error);
  }
}
