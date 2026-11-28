import { clearYapinSessionCookie } from '../_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  clearYapinSessionCookie(res);
  return res.status(200).json({ signedOut: true });
}
