import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_FREE_POINTS, DAILY_MISSIONS, getDailyMissionStatus } from '../src/lib/missions.js';

test('daily reward amounts are fixed', () => {
  assert.equal(DAILY_FREE_POINTS, 25);
  assert.deepEqual(DAILY_MISSIONS.map((mission) => mission.reward), [15, 30, 40]);
});

test('one completed Daily round unlocks warm-up and a win unlocks spotlight', () => {
  const missions = getDailyMissionStatus({ gamesPlayed: 1, wins: 1, gameModes: ['song'] });
  assert.equal(missions[0].completed, true);
  assert.equal(missions[1].completed, true);
  assert.equal(missions[2].completed, false);
  assert.equal(missions[2].current, 1);
});

test('double feature requires both Daily game modes', () => {
  const missions = getDailyMissionStatus({ gamesPlayed: 2, wins: 0, gameModes: ['song', 'band'] });
  assert.equal(missions[2].completed, true);
});

test('claimed mission ids remain marked as claimed', () => {
  const missions = getDailyMissionStatus({ gamesPlayed: 1, wins: 0, gameModes: ['song'] }, ['play_daily']);
  assert.equal(missions[0].claimed, true);
});

test('Random rounds advance daily mission progress too', () => {
  const missions = getDailyMissionStatus({
    gamesPlayed: 3,
    wins: 2,
    gameModes: ['song', 'band']
  });
  assert.equal(missions[0].completed, true);
  assert.equal(missions[1].completed, true);
  assert.equal(missions[2].completed, true);
});
