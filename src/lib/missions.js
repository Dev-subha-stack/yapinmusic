export const DAILY_FREE_POINTS = 25;

export const DAILY_MISSIONS = Object.freeze([
  { id: 'play_daily', title: 'Warm up', description: 'Finish one Daily round in Guess the Song or Guess the Band.', reward: 15, metric: 'gamesPlayed', target: 1 },
  { id: 'win_daily', title: 'Spotlight win', description: 'Win at least one Daily music challenge.', reward: 30, metric: 'wins', target: 1 },
  { id: 'double_feature', title: 'Double feature', description: 'Finish both Daily games: Guess the Song and Guess the Band.', reward: 40, metric: 'gameModes', target: 2 },
]);

export function getDailyMissionStatus(metrics = {}, claimedMissionIds = []) {
  const claimed = new Set(claimedMissionIds);
  const modes = Array.isArray(metrics.gameModes) ? Array.from(new Set(metrics.gameModes)) : [];
  return DAILY_MISSIONS.map((mission) => {
    const current = mission.metric === 'gameModes' ? modes.length : Math.max(0, Number(metrics[mission.metric]) || 0);
    return { ...mission, current: Math.min(mission.target, current), completed: current >= mission.target, claimed: claimed.has(mission.id) };
  });
}
