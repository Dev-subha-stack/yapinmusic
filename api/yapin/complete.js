import { createHash } from 'node:crypto';
import { getPool } from '../_lib/db.js';
import { requireNeonUser, sendApiError } from '../_lib/auth.js';

const CLIENT_ID = '6dd7023b-622a-4fbe-a730-fec0637bbee3';
const REDIRECT_URI = 'https://yapinmusic.vercel.app/';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function upstreamError(message) {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { userId } = await requireNeonUser(req);
    const body = req.body || {};
    const code = String(body.code || '').trim();
    const state = String(body.state || '').trim();
    if (!code || code.length > 2048 || !state || state.length > 256) {
      return res.status(400).json({ error: 'The Yapin verification response is incomplete. Please try again.' });
    }

    const pool = getPool();
    const stateHash = createHash('sha256').update(state).digest('base64url');
    const claimedState = await pool.query(
      `delete from public.yapin_oauth_states
        where state_hash = $1 and user_id = $2 and expires_at > now()
        returning code_verifier`,
      [stateHash, userId]
    );
    if (!claimedState.rowCount) {
      return res.status(400).json({ error: 'This Yapin verification link has expired or does not match your signed-in account. Start verification again.' });
    }

    const form = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: claimedState.rows[0].code_verifier
    });
    const tokenResponse = await fetch('https://www.yapin.gg/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: form.toString()
    });
    const tokenBody = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !tokenBody || typeof tokenBody.access_token !== 'string' || !tokenBody.access_token) {
      throw upstreamError('Yapin could not complete the verification. Please start again.');
    }

    const userResponse = await fetch('https://www.yapin.gg/api/oauth/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + tokenBody.access_token,
        'Accept': 'application/json'
      }
    });
    const userBody = await userResponse.json().catch(() => null);
    if (!userResponse.ok || !userBody) {
      throw upstreamError('Yapin did not return a verified account. Please start again.');
    }

    const yapinUser = userBody.user || (userBody.data && userBody.data.user) || userBody;
    const yapinUserId = String(yapinUser.id || '').trim();
    const yapinUsername = String(yapinUser.username || '').trim();
    const yapinDisplayName = String(yapinUser.display_name || yapinUser.displayName || yapinUser.name || yapinUsername).trim();

    if (!UUID_PATTERN.test(yapinUserId) || !yapinUsername || yapinUsername.length > 80 || !yapinDisplayName || yapinDisplayName.length > 100) {
      throw upstreamError('Yapin returned an account profile in an unexpected format. Please try again later.');
    }

    const updated = await pool.query(
      `update public.player_profiles
          set yapin_user_id = $1,
              yapin_username = $2,
              yapin_display_name = $3,
              yapin_verified_at = now(),
              updated_at = now()
        where user_id = $4
        returning user_id, username, bio, avatar_url, banner_url,
                  yapin_username, yapin_display_name, yapin_verified_at`,
      [yapinUserId, yapinUsername, yapinDisplayName, userId]
    );
    if (!updated.rowCount) {
      return res.status(404).json({ error: 'Your Yapin Music player profile could not be found.' });
    }

    return res.status(200).json({ verified: true, profile: updated.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      error.statusCode = 409;
      error.message = 'This Yapin account is already linked to another Yapin Music profile.';
    }
    return sendApiError(res, error);
  }
}
