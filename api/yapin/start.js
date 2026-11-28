import { createHash, randomBytes } from 'node:crypto';
import { getPool } from '../_lib/db.js';
import { sendApiError } from '../_lib/auth.js';

const CLIENT_ID = '6dd7023b-622a-4fbe-a730-fec0637bbee3';
const REDIRECT_URI = 'https://yapinmusic.vercel.app/';

function base64url(value) {
  return value.toString('base64url');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const state = base64url(randomBytes(32));
    const codeVerifier = base64url(randomBytes(48));
    const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());

    const pool = getPool();
    await pool.query('delete from public.yapin_oauth_states where expires_at <= now()');
    await pool.query(
      `insert into public.yapin_oauth_states (state_hash, user_id, code_verifier, expires_at, flow)
       values ($1, null, $2, now() + interval '10 minutes', 'login')`,
      [createHash('sha256').update(state).digest('base64url'), codeVerifier]
    );

    const authorize = new URL('https://www.yapin.gg/oauth/authorize');
    authorize.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'identify',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }).toString();

    return res.status(200).json({ authorizationUrl: authorize.toString() });
  } catch (error) {
    return sendApiError(res, error);
  }
}
