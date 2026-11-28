import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla/adapters';

const env = import.meta.env || {};
const authUrl = String(env.VITE_NEON_AUTH_URL || '').trim();

export const authClient = authUrl
  ? createAuthClient(authUrl, {
      adapter: BetterAuthVanillaAdapter({
        fetchOptions: { credentials: 'include' }
      })
    })
  : null;

let currentSession = null;
let currentUser = null;
let currentProfile = null;
let authLoading = Boolean(authClient);
let accountError = null;
let adapter = null;
let refreshInFlight = null;
const accountListeners = new Set();

function notifyAccount() {
  const state = getAccountState();
  accountListeners.forEach((listener) => {
    try { listener(state); }
    catch (error) { console.warn('Account listener failed.', error); }
  });
}

function apiErrorMessage(body, fallback) {
  return body && typeof body.error === 'string' ? body.error : fallback;
}

async function apiRequest(path, options = {}, tokenRequired = true) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tokenRequired) {
    let session = currentSession || await readSession();
    if (!session) session = await readYapinSession();
    if (!session) throw new Error('Sign in to use your player account.');
    if (session.provider !== 'yapin') {
      const token = session.token;
      if (!token) throw new Error('Sign in to use your player account.');
      headers.set('Authorization', 'Bearer ' + token);
    }
  }
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(apiErrorMessage(body, 'The request could not be completed.'));
    error.status = response.status;
    throw error;
  }
  return body;
}

async function readSession() {
  if (!authClient) return null;
  const result = await authClient.getSession();
  if (result.error) throw result.error;
  currentSession = result.data && result.data.session ? result.data.session : null;
  currentUser = result.data && result.data.user ? result.data.user : null;
  return currentSession;
}

async function loadProfile() {
  if (!currentSession || !currentUser) {
    currentProfile = null;
    return null;
  }
  const result = await apiRequest('/api/profile', { method: 'GET' });
  currentProfile = result.profile || null;
  return currentProfile;
}

async function readYapinSession() {
  const response = await fetch('/api/yapin/session', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok || !body.user) {
    throw new Error(apiErrorMessage(body, 'Could not restore your Yapin session.'));
  }
  currentSession = { provider: 'yapin', token: null };
  currentUser = body.user;
  currentProfile = body.profile || null;
  return currentSession;
}

async function clearYapinSession() {
  const response = await fetch('/api/yapin/logout', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Could not end the Yapin session.');
}

async function refreshAccountState(options = {}) {
  if (!authClient) {
    authLoading = false;
    currentSession = null;
    currentUser = null;
    currentProfile = null;
    notifyAccount();
    return getAccountState();
  }
  if (refreshInFlight) return refreshInFlight;

  const silent = Boolean(options && options.silent);
  const hadAccount = Boolean(currentSession && currentUser);
  const previousSession = currentSession;
  const previousUser = currentUser;
  const previousProfile = currentProfile;
  const previousUserId = previousUser && previousUser.id;

  refreshInFlight = (async () => {
    // A passive focus/visibility refresh must not replace an active profile editor.
    // In particular, opening a native file picker returns focus to the window.
    if (!silent || !hadAccount) {
      authLoading = true;
      notifyAccount();
    }

    let shouldNotify = !silent || !hadAccount;
    try {
      try {
        await readSession();
      } catch (neonError) {
        const yapinSession = await readYapinSession().catch(() => null);
        if (!yapinSession) throw neonError;
      }
      if (!currentSession || !currentUser) await readYapinSession();
      if (currentSession && currentUser) {
        // Keep the current profile object during passive refreshes for the same user.
        if (!silent || !hadAccount || previousUserId !== currentUser.id) {
          if (currentSession.provider !== 'yapin') await loadProfile();
        } else if (currentSession.provider !== 'yapin') {
          currentProfile = previousProfile;
        }
      } else {
        currentProfile = null;
      }
      accountError = null;
      const nextUserId = currentUser && currentUser.id;
      if (previousUserId !== nextUserId) shouldNotify = true;
    } catch (error) {
      accountError = error.message || 'Could not restore your Neon Auth session.';
      if (silent && hadAccount) {
        // A temporary background/network failure should not sign the player out
        // or discard unsaved changes in the profile editor.
        currentSession = previousSession;
        currentUser = previousUser;
        currentProfile = previousProfile;
        shouldNotify = false;
      } else {
        currentSession = null;
        currentUser = null;
        currentProfile = null;
        shouldNotify = true;
      }
    } finally {
      authLoading = false;
      refreshInFlight = null;
      if (shouldNotify) notifyAccount();
    }
    return getAccountState();
  })();
  return refreshInFlight;
}

if (authClient && typeof window !== 'undefined') {
  refreshAccountState();
  window.addEventListener('focus', () => { refreshAccountState({ silent: true }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshAccountState({ silent: true });
  });
}

export function getAccountState() {
  return {
    configured: Boolean(authClient),
    loading: authLoading,
    user: currentUser,
    profile: currentProfile,
    error: accountError
  };
}

export function subscribeAccount(listener) {
  if (typeof listener !== 'function') throw new TypeError('Account listener must be a function.');
  accountListeners.add(listener);
  listener(getAccountState());
  return () => accountListeners.delete(listener);
}

function validateUsername(value) {
  const username = String(value || '').trim();
  if (!/^[\p{L}\p{N}_. -]{3,24}$/u.test(username)) {
    throw new Error('Choose a public name with 3–24 letters, numbers, spaces, dots, dashes or underscores.');
  }
  return username;
}

export async function signUp({ email, password, username }) {
  if (!authClient) throw new Error('Neon Auth is not configured on this site yet.');
  if (currentSession && currentSession.provider === 'yapin') await clearYapinSession();
  const cleanName = validateUsername(username);
  const result = await authClient.signUp.email({
    name: cleanName,
    email: String(email || '').trim(),
    password
  });
  if (result.error) throw result.error;
  await refreshAccountState();
  if (currentSession && currentUser) {
    await saveUsername(cleanName);
  }
  return { confirmationPending: !currentSession, user: currentUser || (result.data && result.data.user) || null };
}

export async function signIn({ email, password }) {
  if (!authClient) throw new Error('Neon Auth is not configured on this site yet.');
  if (currentSession && currentSession.provider === 'yapin') await clearYapinSession();
  const result = await authClient.signIn.email({
    email: String(email || '').trim(),
    password
  });
  if (result.error) throw result.error;
  await refreshAccountState();
  if (currentSession && currentUser && !currentProfile && currentUser.name) {
    await saveUsername(currentUser.name);
  }
  return currentUser;
}

export async function saveProfileDetails({
  username,
  bio = '',
  tagline = currentProfile?.tagline || '',
  accentColor = currentProfile?.accent_color || '#FF6B35',
  cardStyle = currentProfile?.card_style || 'classic',
  avatarShape = currentProfile?.avatar_shape || 'rounded',
  profileEffect = currentProfile?.profile_effect || 'none',
  avatarData = null,
  bannerData = null
}) {
  if (!authClient || !currentSession) throw new Error('Sign in before editing your player profile.');
  const cleanUsername = validateUsername(username);
  const cleanBio = String(bio || '').trim();
  const cleanTagline = String(tagline || '').trim();
  if (cleanBio.length > 160) throw new Error('Your bio must be 160 characters or fewer.');
  if (cleanTagline.length > 60) throw new Error('Your one-line status must be 60 characters or fewer.');
  const payload = {
    username: cleanUsername,
    bio: cleanBio,
    tagline: cleanTagline,
    accentColor,
    cardStyle,
    avatarShape,
    profileEffect
  };
  if (avatarData) payload.avatarData = avatarData;
  if (bannerData) payload.bannerData = bannerData;
  const result = await apiRequest('/api/profile', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  currentProfile = result.profile || null;
  accountError = null;
  notifyAccount();
  return currentProfile;
}

export async function saveUsername(value) {
  return saveProfileDetails({
    username: value,
    bio: currentProfile ? currentProfile.bio || '' : ''
  });
}

export async function startYapinLogin() {
  const response = await fetch('/api/yapin/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.authorizationUrl) {
    throw new Error(apiErrorMessage(body, 'Could not start Yapin sign-in.'));
  }
  return body.authorizationUrl;
}

export async function completeYapinLogin({ code, state } = {}) {
  const result = await apiRequest('/api/yapin/complete', {
    method: 'POST',
    body: JSON.stringify({ code, state })
  }, false);
  if (!result.signedIn || !result.user) throw new Error('Yapin did not complete sign-in.');
  currentSession = { provider: 'yapin', token: null };
  currentUser = result.user;
  currentProfile = result.profile || null;
  accountError = null;
  authLoading = false;
  notifyAccount();
  return currentProfile;
}

export async function signOut() {
  if (!authClient) return;
  if (currentSession && currentSession.provider === 'yapin') {
    await clearYapinSession();
  } else {
    const result = await authClient.signOut();
    if (result.error) throw result.error;
    await clearYapinSession().catch(() => {});
  }
  currentSession = null;
  currentUser = null;
  currentProfile = null;
  accountError = null;
  authLoading = false;
  notifyAccount();
}

export function isLeaderboardConfigured() {
  return Boolean(adapter || (authUrl && authClient));
}

export async function getLeaderboard(options = {}) {
  if (adapter) return adapter.getLeaderboard(options);
  if (!authUrl) return { configured: false, entries: [] };
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 100));
  const response = await fetch('/api/leaderboard?limit=' + limit, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(apiErrorMessage(body, 'The leaderboard could not be loaded.'));
  return { configured: true, entries: body.entries || [] };
}

export async function getPublicProfile(userId) {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId || cleanUserId.length > 128) {
    throw new Error('This player profile link is invalid.');
  }
  const result = await apiRequest(
    '/api/public-profile?userId=' + encodeURIComponent(cleanUserId),
    { method: 'GET' },
    false
  );
  return result.profile || null;
}

export async function getPlayerLeaderboardEntry() {
  if (!authClient || !currentSession) return null;
  const result = await apiRequest('/api/profile', { method: 'GET' });
  currentProfile = result.profile || null;
  notifyAccount();
  return currentProfile;
}

export async function getDailyTasks() {
  if (!authClient || !currentSession) throw new Error('Sign in to view daily tasks.');
  return apiRequest('/api/tasks', { method: 'GET' });
}

export async function claimDailyReward({ type, missionId = null } = {}) {
  if (!authClient || !currentSession) throw new Error('Sign in to collect daily points.');
  return apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ type, missionId })
  });
}

export async function submitScore(score) {
  if (adapter) return adapter.submitScore(score);
  if (!authClient) return { saved: false, reason: 'backend-not-configured' };
  if (!currentSession) return { saved: false, reason: 'not-signed-in' };
  if (!currentProfile) return { saved: false, reason: 'profile-required' };
  try {
    return await apiRequest('/api/submit-score', {
      method: 'POST',
      body: JSON.stringify({
        gameMode: score.gameMode,
        difficulty: score.difficulty,
        won: Boolean(score.won),
        guessesUsed: Number(score.guessesUsed) || 0,
        puzzleDate: score.puzzleDate,
        roundType: score.roundType === 'random' ? 'random' : 'daily',
        roundId: score.roundType === 'random' ? score.roundId : null
      })
    });
  } catch (error) {
    if (error.status === 409 && /already been submitted/i.test(error.message)) {
      return { saved: true, duplicate: true };
    }
    throw error;
  }
}

export function rankFor(points) {
  const ranks = [
    { name: 'Rookie Listener', min: 0 },
    { name: 'Bronze Listener', min: 300 },
    { name: 'Silver Listener', min: 750 },
    { name: 'Gold Listener', min: 1500 },
    { name: 'Platinum Listener', min: 2500 },
    { name: 'Diamond Listener', min: 4000 },
    { name: 'Legend', min: 6000 }
  ];
  const total = Math.max(0, Number(points) || 0);
  let index = 0;
  for (let i = 0; i < ranks.length; i += 1) {
    if (total >= ranks[i].min) index = i;
  }
  const current = ranks[index];
  const next = ranks[index + 1] || null;
  return {
    name: current.name,
    min: current.min,
    next: next ? next.min : null,
    nextName: next ? next.name : null,
    progress: next ? Math.max(0, Math.min(100, ((total - current.min) / (next.min - current.min)) * 100)) : 100
  };
}

export function configureLeaderboardAdapter(nextAdapter) {
  if (!nextAdapter || typeof nextAdapter.getLeaderboard !== 'function' || typeof nextAdapter.submitScore !== 'function') {
    throw new TypeError('Leaderboard adapter must implement getLeaderboard() and submitScore().');
  }
  adapter = nextAdapter;
}


export async function getDecorations(page = 1) {
  const cleanPage = Math.max(1, Math.min(100, Number(page) || 1));
  const hasSession = Boolean(currentSession && currentUser);
  return apiRequest('/api/decorations?page=' + cleanPage, { method: 'GET' }, hasSession);
}

export async function submitCommunityDecoration({ name, imageData, originalArtAttested } = {}) {
  return apiRequest('/api/decorations', {
    method: 'POST',
    body: JSON.stringify({ action: 'submit', name, imageData, originalArtAttested: originalArtAttested === true })
  });
}

export async function wearCommunityDecoration(decorationId) {
  const result = await apiRequest('/api/decorations', {
    method: 'POST',
    body: JSON.stringify({ action: 'wear', decorationId })
  });
  await getPlayerLeaderboardEntry().catch(() => null);
  return result;
}

export async function removeCommunityDecoration() {
  const result = await apiRequest('/api/decorations', {
    method: 'POST',
    body: JSON.stringify({ action: 'unwear' })
  });
  await getPlayerLeaderboardEntry().catch(() => null);
  return result;
}

export async function withdrawCommunityDecoration(decorationId) {
  return apiRequest('/api/decorations', {
    method: 'POST',
    body: JSON.stringify({ action: 'withdraw', decorationId })
  });
}

export async function sendPresenceHeartbeat() {
  return apiRequest('/api/presence', { method: 'POST', body: '{}' });
}

export async function getAdminAccess() {
  return apiRequest('/api/admin?scope=access', { method: 'GET' });
}

export async function getAdminDashboard() {
  return apiRequest('/api/admin', { method: 'GET' });
}

export async function moderateCommunityDecoration({ action, decorationId, reason, note } = {}) {
  return apiRequest('/api/admin', {
    method: 'POST',
    body: JSON.stringify({ action, decorationId, reason, note })
  });
}


export async function getYapinAdmins() {
  return apiRequest('/api/admin?scope=admins', { method: 'GET' });
}

export async function grantYapinAdmin(email) {
  return apiRequest('/api/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'grant-admin', email })
  });
}

export async function removeYapinAdmin(userId) {
  return apiRequest('/api/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'remove-admin', userId })
  });
}
