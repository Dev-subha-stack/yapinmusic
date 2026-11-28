import { createHash } from 'node:crypto';
import { SignJWT } from 'jose';
import { getPool } from '../_lib/db.js';
import { sendApiError } from '../_lib/auth.js';

const CLIENT_ID = '6dd7023b-622a-4fbe-a730-fec0637bbee3';
const REDIRECT_URI = 'https://yapinmusic.vercel.app/';
const SESSION_ISSUER = 'https://yapinmusic.vercel.app';
const SESSION_AUDIENCE = 'yapinmusic-web';

function upstreamError(message) {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
}

function normalizeYapinUser(body) {
  const user = body && (body.user || (body.data && (body.data.user || body.data)) || body);
  const id = user && user.id != null ? String(user.id).trim() : '';
  const username = String(user && (user.username || user.user_name || user.handle) || '').trim();
  const displayName = String(user && (user.display_name || user.displayName || user.name) || username).trim();
  if (!id || id.length > 128 || !username || username.length > 80 || !displayName || displayName.length > 100) {
    throw upstreamError('Yapin returned an account profile in an unexpected format.');
  }
  return { id, username, displayName };
}

function profileUsername(username, stableHash) {
  const cleaned = String(username || '')
    .replace(/[^\p{L}\p{N}_. -]/gu, '')
    .trim()
    .replace(/\s+/g, ' ');
  const base = Array.from(cleaned || 'Yapin').slice(0, 15).join('');
  return base + '-' + stableHash.slice(0, 8);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = req.body || {};
    const code = String(body.code || '').trim();
    const state = String(body.state || '').trim();
    if (!code || code.length > 2048 || !state || state.length > 256) {
      return res.status(400).json({ error: 'The Yapin sign-in response is incomplete. Please try again.' });
    }

    const pool = getPool();
    const stateHash = createHash('sha256').update(state).digest('base64url');
    const claimedState = await pool.query(
      `delete from public.yapin_oauth_states
        where state_hash = $1 and flow = 'login' and user_id is null and expires_at > now()
        returning code_verifier`,
      [stateHash]
    );
    if (!claimedState.rowCount) {
      return res.status(400).json({ error: 'This Yapin sign-in link has expired or was already used. Start again.' });
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
      throw upstreamError('Yapin could not complete sign-in. Please try again.');
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
      throw upstreamError('Yapin did not return a signed-in account. Please try again.');
    }

    const yapinUser = normalizeYapinUser(userBody);
    const stableHash = createHash('sha256').update(yapinUser.id).digest('hex');
    const internalEmail = 'yapin-' + stableHash + '@accounts.yapinmusic.invalid';
    const preferredUsername = profileUsername(yapinUser.username, stableHash);

    const client = await pool.connect();
    try {
      await client.query('begin');
      const existing = await client.query(
        `select p.user_id
           from public.player_profiles p
          where p.yapin_user_id = $1
          limit 1
          for update`,
        [yapinUser.id]
      );

      let userId;
      if (existing.rowCount) {
        userId = existing.rows[0].user_id;
        await client.query(
          `update public.player_profiles
              set yapin_username = $2,
                  yapin_display_name = $3,
                  updated_at = now()
            where user_id = $1`,
          [userId, yapinUser.username, yapinUser.displayName]
        );
      } else {
        const createdUser = await client.query(
          `insert into neon_auth."user" ("name", "email", "emailVerified", "createdAt", "updatedAt")
           values ($1, $2, false, now(), now())
           on conflict ("email") do update
             set "name" = excluded."name",
                 "updatedAt" = now()
           returning "id"`,
          [yapinUser.displayName, internalEmail]
        );
        userId = createdUser.rows[0].id;

        await client.query(
          `insert into public.player_profiles
             (user_id, username, yapin_user_id, yapin_username, yapin_display_name)
           values ($1, $2, $3, $4, $5)
           on conflict (user_id) do update
             set yapin_user_id = excluded.yapin_user_id,
                 yapin_username = excluded.yapin_username,
                 yapin_display_name = excluded.yapin_display_name,
                 updated_at = now()`,
          [userId, preferredUsername, yapinUser.id, yapinUser.username, yapinUser.displayName]
        );
      }

      const profileResult = await client.query(
        `select p.user_id, p.username, p.bio, p.avatar_url, p.banner_url,
                coalesce(l.total_points, 0)::integer as total_points,
                coalesce(l.wins, 0)::integer as wins,
                coalesce(l.games_played, 0)::integer as games_played,
                l.rank_position, p.yapin_username
           from public.player_profiles p
           left join public.player_leaderboard l on l.user_id = p.user_id
          where p.user_id = $1
          limit 1`,
        [userId]
      );
      const secret = String(process.env.YAPIN_SESSION_SECRET || '');
      if (secret.length < 48) throw new Error('The Yapin session signing secret is not configured.');
      const sessionToken = await new SignJWT({
        provider: 'yapin',
        yapinUserId: yapinUser.id,
        yapinUsername: yapinUser.username
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(String(userId))
        .setIssuer(SESSION_ISSUER)
        .setAudience(SESSION_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(new TextEncoder().encode(secret));
      await client.query('commit');

      res.setHeader('Set-Cookie',
        'yapinmusic_session=' + sessionToken + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000'
      );
      return res.status(200).json({
        signedIn: true,
        user: {
          id: String(userId),
          name: yapinUser.displayName,
          email: null,
          provider: 'yapin',
          yapinUserId: yapinUser.id,
          yapinUsername: yapinUser.username
        },
        profile: profileResult.rows[0] || null
      });
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return sendApiError(res, error);
  }
}
