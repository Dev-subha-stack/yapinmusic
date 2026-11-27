import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const projectUrl = String(env.VITE_SUPABASE_URL || '').trim();
const publicKey = String(env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabase = projectUrl && publicKey
  ? createClient(projectUrl, publicKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    })
  : null;

let currentSession = null;
let currentProfile = null;
let authLoading = Boolean(supabase);
let accountError = null;
let adapter = null;
const accountListeners = new Set();

function notifyAccount() {
  const state = getAccountState();
  accountListeners.forEach((listener) => {
    try { listener(state); } catch (error) { console.warn('Account listener failed.', error); }
  });
}

async function loadProfile(userId) {
  if (!supabase || !userId) {
    currentProfile = null;
    authLoading = false;
    notifyAccount();
    return null;
  }
  const { data, error } = await supabase.from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  currentProfile = data || null;
  authLoading = false;
  accountError = null;
  notifyAccount();
  return currentProfile;
}

if (supabase) {
  supabase.auth.getSession().then(async ({ data, error }) => {
    if (error) accountError = error.message;
    currentSession = data && data.session ? data.session : null;
    if (currentSession) {
      try { await loadProfile(currentSession.user.id); }
      catch (profileError) {
        accountError = profileError.message;
        authLoading = false;
        notifyAccount();
      }
    } else {
      authLoading = false;
      notifyAccount();
    }
  }).catch((error) => {
    accountError = error.message;
    authLoading = false;
    notifyAccount();
  });

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    currentSession = nextSession;
    currentProfile = null;
    authLoading = Boolean(nextSession);
    accountError = null;
    notifyAccount();
    Promise.resolve().then(async () => {
      if (!nextSession) {
        authLoading = false;
        notifyAccount();
        return;
      }
      try { await loadProfile(nextSession.user.id); }
      catch (error) {
        accountError = error.message;
        authLoading = false;
        notifyAccount();
      }
    });
  });
}

export function getAccountState() {
  return {
    configured: Boolean(supabase),
    loading: authLoading,
    user: currentSession ? currentSession.user : null,
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

export async function signUp({ email, password, username }) {
  if (!supabase) throw new Error('Account services are not connected yet.');
  const cleanName = String(username || '').trim();
  if (!/^[\p{L}\p{N}_. -]{3,24}$/u.test(cleanName)) {
    throw new Error('Choose a public name with 3–24 letters, numbers, spaces, dots, dashes or underscores.');
  }
  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim(),
    password,
    options: { data: { username: cleanName } }
  });
  if (error) throw error;
  if (data.session) {
    currentSession = data.session;
    await saveUsername(cleanName);
  }
  return { confirmationPending: !data.session, user: data.user || null };
}

export async function signIn({ email, password }) {
  if (!supabase) throw new Error('Account services are not connected yet.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password
  });
  if (error) throw error;
  currentSession = data.session;
  const loaded = await loadProfile(data.user.id);
  if (!loaded && data.user.user_metadata && data.user.user_metadata.username) {
    await saveUsername(data.user.user_metadata.username);
  }
  return data.user;
}

export async function saveUsername(username) {
  if (!supabase || !currentSession) throw new Error('Sign in before choosing a leaderboard name.');
  const cleanName = String(username || '').trim();
  if (!/^[\p{L}\p{N}_. -]{3,24}$/u.test(cleanName)) {
    throw new Error('Choose a public name with 3–24 letters, numbers, spaces, dots, dashes or underscores.');
  }
  const { data, error } = await supabase.from('profiles')
    .upsert({ id: currentSession.user.id, username: cleanName }, { onConflict: 'id' })
    .select('id, username, avatar_url')
    .single();
  if (error) throw error;
  currentProfile = data;
  accountError = null;
  notifyAccount();
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  currentSession = null;
  currentProfile = null;
  authLoading = false;
  notifyAccount();
}

export function isLeaderboardConfigured() {
  return Boolean(adapter || supabase);
}

export async function getLeaderboard(options = {}) {
  if (adapter) return adapter.getLeaderboard(options);
  if (!supabase) return { configured: false, entries: [] };
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 100));
  const { data, error } = await supabase.from('player_leaderboard')
    .select('user_id, username, total_points, wins, games_played, rank_position')
    .order('total_points', { ascending: false })
    .order('wins', { ascending: false })
    .order('username', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return { configured: true, entries: data || [] };
}

export async function getPlayerLeaderboardEntry() {
  if (!supabase || !currentSession) return null;
  const { data, error } = await supabase.from('player_leaderboard')
    .select('user_id, username, total_points, wins, games_played, rank_position')
    .eq('user_id', currentSession.user.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function submitScore(score) {
  if (adapter) return adapter.submitScore(score);
  if (!supabase) return { saved: false, reason: 'backend-not-configured' };
  if (!currentSession) return { saved: false, reason: 'not-signed-in' };
  if (!currentProfile) return { saved: false, reason: 'profile-required' };

  const { data, error } = await supabase.functions.invoke('submit-score', {
    body: {
      game_mode: score.gameMode,
      difficulty: score.difficulty,
      won: Boolean(score.won),
      guesses_used: Number(score.guessesUsed) || 0,
      puzzle_date: score.puzzleDate
    }
  });
  if (error) {
    const status = error.context && error.context.status;
    if (status === 409) return { saved: true, duplicate: true };
    throw error;
  }
  return data || { saved: true };
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
