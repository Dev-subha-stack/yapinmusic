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
    const session = currentSession || await readSession();
    const token = session && session.token;
    if (!token) throw new Error('Sign in to use your player account.');
    headers.set('Authorization', 'Bearer ' + token);
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
      await readSession();
      if (currentSession && currentUser) {
        // Keep the current profile object during a passive refresh for the same user.
        // The token may refresh, but the open editor and its selected File objects stay intact.
        if (!silent || !hadAccount || previousUserId !== currentUser.id) {
          await loadProfile();
        } else {
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

export async function saveProfileDetails({ username, bio = '', avatarData = null, bannerData = null }) {
  if (!authClient || !currentSession) throw new Error('Sign in before editing your player profile.');
  const cleanUsername = validateUsername(username);
  const cleanBio = String(bio || '').trim();
  if (cleanBio.length > 160) throw new Error('Your bio must be 160 characters or fewer.');
  const payload = { username: cleanUsername, bio: cleanBio };
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

export async function signOut() {
  if (!authClient) return;
  const result = await authClient.signOut();
  if (result.error) throw result.error;
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
        puzzleDate: score.puzzleDate
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
