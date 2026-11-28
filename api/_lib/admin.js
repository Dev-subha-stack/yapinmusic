export function requireYapinAdmin(user) {
  const allowedIds = String(process.env.YAPIN_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!allowedIds.length) {
    const error = new Error('Admin access is not configured yet. Set YAPIN_ADMIN_USER_IDS in the Vercel project environment.');
    error.statusCode = 403;
    throw error;
  }
  if (!user || !allowedIds.includes(String(user.userId || ''))) {
    const error = new Error('You do not have permission to access the Yapin Music admin panel.');
    error.statusCode = 403;
    throw error;
  }
  return user;
}
