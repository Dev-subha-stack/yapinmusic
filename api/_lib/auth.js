import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwks;
let jwksUrl;
let expectedIssuer;

function verifier() {
  const baseUrl = String(process.env.NEON_AUTH_BASE_URL || '').trim();
  if (!baseUrl) throw new Error('The Neon Auth server environment variable is missing.');
  if (!jwks || jwksUrl !== baseUrl) {
    const parsed = new URL(baseUrl);
    jwksUrl = baseUrl;
    expectedIssuer = parsed.origin;
    jwks = createRemoteJWKSet(new URL(baseUrl.replace(/\/$/, '') + '/.well-known/jwks.json'));
  }
  return { jwks, expectedIssuer };
}

function readCookie(req, name) {
  const header = req.headers && req.headers.cookie;
  if (typeof header !== 'string') return '';
  const entry = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

export async function requireNeonUser(req) {
  const authorization = req.headers && (req.headers.authorization || req.headers.Authorization);
  const match = typeof authorization === 'string' && authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    const sessionToken = readCookie(req, 'yapinmusic_session');
    const secret = String(process.env.YAPIN_SESSION_SECRET || '');
    if (sessionToken && secret.length >= 48) {
      try {
        const verified = await jwtVerify(sessionToken, new TextEncoder().encode(secret), {
          algorithms: ['HS256'],
          issuer: 'https://yapinmusic.vercel.app',
          audience: 'yapinmusic-web'
        });
        const payload = verified.payload;
        if (payload.provider === 'yapin' &&
            typeof payload.sub === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub)) {
          return { userId: payload.sub, claims: payload, provider: 'yapin' };
        }
      } catch {
        // An expired or invalid Yapin cookie is treated as signed out.
      }
    }
    const error = new Error('Sign in to continue.');
    error.statusCode = 401;
    throw error;
  }

  const { jwks: keySet, expectedIssuer: issuer } = verifier();
  let payload;
  try {
    const verified = await jwtVerify(match[1], keySet, {
      algorithms: ['EdDSA'],
      issuer,
      audience: issuer
    });
    payload = verified.payload;
  } catch {
    const error = new Error('Your Neon Auth session is invalid or has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }
  if (typeof payload.sub !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub)) {
    const error = new Error('The sign-in token did not contain a valid player ID.');
    error.statusCode = 401;
    throw error;
  }
  return { userId: payload.sub, claims: payload, provider: 'neon' };
}

export function clearYapinSessionCookie(res) {
  res.setHeader('Set-Cookie', 'yapinmusic_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
}

export function sendApiError(res, error) {
  const status = Number(error && error.statusCode) || 500;
  if (status >= 500) console.error('YapinMusic API error:', error);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : (error.message || 'Request failed.')
  });
}
