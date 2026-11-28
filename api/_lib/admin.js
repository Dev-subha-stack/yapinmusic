import { getPool } from './db.js';

function forbidden(message) {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
}

export async function requireYapinAdmin(user, options = {}) {
  if (!user || !user.userId) {
    const error = new Error('Sign in to access the admin panel.');
    error.statusCode = 401;
    throw error;
  }
  const result = await getPool().query(
    'select user_id, role, created_at from public.yapin_admins where user_id = $1 limit 1',
    [user.userId]
  );
  const admin = result.rows[0];
  if (!admin) {
    throw forbidden('You do not have permission to access the Yapin Music admin panel.');
  }
  if (options.ownerOnly && admin.role !== 'owner') {
    throw forbidden('Only the Yapin Music owner can manage administrator accounts.');
  }
  return { ...user, adminRole: admin.role };
}
