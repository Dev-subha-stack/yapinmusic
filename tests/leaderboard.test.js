import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configureLeaderboardAdapter,
  getLeaderboard,
  isLeaderboardConfigured,
  submitScore
} from '../src/services/leaderboard.js';

test('reports an inactive backend without breaking local play', async () => {
  assert.equal(isLeaderboardConfigured(), false);
  assert.deepEqual(await getLeaderboard(), { configured: false, entries: [] });
  assert.deepEqual(await submitScore({ score: 10 }), { saved: false, reason: 'backend-not-configured' });
});

test('requires both adapter methods', () => {
  assert.throws(() => configureLeaderboardAdapter({ getLeaderboard() {} }), /must implement/);
});

test('delegates reads and score submissions to a configured adapter', async () => {
  const calls = [];
  configureLeaderboardAdapter({
    async getLeaderboard(options) {
      calls.push(['read', options]);
      return { configured: true, entries: [{ username: 'Player', best_score: 25 }] };
    },
    async submitScore(score) {
      calls.push(['write', score]);
      return { saved: true };
    }
  });

  const options = { gameMode: 'song', difficulty: 'easy' };
  const score = { gameMode: 'song', difficulty: 'easy', score: 25 };
  assert.deepEqual(await getLeaderboard(options), {
    configured: true,
    entries: [{ username: 'Player', best_score: 25 }]
  });
  assert.deepEqual(await submitScore(score), { saved: true });
  assert.deepEqual(calls, [['read', options], ['write', score]]);
  assert.equal(isLeaderboardConfigured(), true);
});
