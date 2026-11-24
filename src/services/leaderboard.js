// Future leaderboard boundary.
// The current game remains local-only; add a database adapter here when auth
// and server-side score validation are implemented.
let adapter = null;

export function configureLeaderboardAdapter(nextAdapter) {
  if (!nextAdapter || typeof nextAdapter.getLeaderboard !== 'function' || typeof nextAdapter.submitScore !== 'function') {
    throw new TypeError('Leaderboard adapter must implement getLeaderboard() and submitScore().');
  }
  adapter = nextAdapter;
}

export function isLeaderboardConfigured() {
  return adapter !== null;
}

export async function getLeaderboard(options = {}) {
  if (!adapter) return { configured: false, entries: [] };
  return adapter.getLeaderboard(options);
}

export async function submitScore(score) {
  if (!adapter) return { saved: false, reason: 'backend-not-configured' };
  return adapter.submitScore(score);
}
