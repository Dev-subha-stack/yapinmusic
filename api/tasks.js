import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';
import { DAILY_FREE_POINTS, getDailyMissionStatus } from '../src/lib/missions.js';

const MISSION_REQUIREMENTS = {
  play_daily: `exists (select 1 from public.game_scores where user_id = $1 and puzzle_date = $4::date)`,
  win_daily: `exists (select 1 from public.game_scores where user_id = $1 and puzzle_date = $4::date and won = true)`,
  double_feature: `(select count(distinct game_mode) from public.game_scores where user_id = $1 and puzzle_date = $4::date) >= 2`
};

function todayInIndia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

async function ensureProfile(pool, userId) {
  const result = await pool.query('select 1 from public.player_profiles where user_id = $1 limit 1', [userId]);
  return result.rowCount > 0;
}

async function readTasks(pool, userId, date) {
  const [activity, claimRows, balanceResult] = await Promise.all([
    pool.query(
      `select count(*)::integer as games_played,
              count(*) filter (where won)::integer as wins,
              coalesce(array_agg(distinct game_mode) filter (where game_mode is not null), array[]::text[]) as game_modes
         from public.game_scores where user_id = $1 and puzzle_date = $2::date`,
      [userId, date]
    ),
    pool.query('select source_key from public.player_point_events where user_id = $1 and event_date = $2::date', [userId, date]),
    pool.query('select total_points from public.player_leaderboard where user_id = $1 limit 1', [userId])
  ]);
  const metrics = {
    gamesPlayed: Number(activity.rows[0]?.games_played || 0),
    wins: Number(activity.rows[0]?.wins || 0),
    gameModes: activity.rows[0]?.game_modes || []
  };
  const claimedKeys = new Set(claimRows.rows.map((row) => row.source_key));
  const claimedMissionIds = Array.from(claimedKeys)
    .filter((key) => key.startsWith('mission:'))
    .map((key) => key.split(':')[1]);
  return {
    date,
    totalPoints: Number(balanceResult.rows[0]?.total_points || 0),
    dailyBonus: { points: DAILY_FREE_POINTS, claimed: claimedKeys.has('daily_bonus:' + date) },
    missions: getDailyMissionStatus(metrics, claimedMissionIds)
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { userId } = await requireNeonUser(req);
    const pool = getPool();
    if (!await ensureProfile(pool, userId)) {
      return res.status(409).json({ error: 'Create your player profile before collecting points.' });
    }
    const date = todayInIndia();
    if (req.method === 'GET') return res.status(200).json(await readTasks(pool, userId, date));

    const body = req.body || {};
    let sourceKey;
    let points;
    let source;
    let inserted;
    if (body.type === 'daily_bonus') {
      source = 'daily_bonus';
      sourceKey = 'daily_bonus:' + date;
      points = DAILY_FREE_POINTS;
      inserted = await pool.query(
        `insert into public.player_point_events (user_id, source, source_key, points, event_date)
         values ($1, $2, $3, $4, $5::date)
         on conflict (user_id, source_key) do nothing returning points`,
        [userId, source, sourceKey, points, date]
      );
    } else if (body.type === 'mission') {
      const mission = getDailyMissionStatus({}, []).find((item) => item.id === body.missionId);
      const requirement = MISSION_REQUIREMENTS[body.missionId];
      if (!mission || !requirement) return res.status(400).json({ error: 'Unknown daily mission.' });
      source = 'mission';
      sourceKey = 'mission:' + mission.id + ':' + date;
      points = mission.reward;
      inserted = await pool.query(
        `insert into public.player_point_events (user_id, source, source_key, points, event_date)
         select $1, $2, $3, $5, $4::date
          where ${requirement}
         on conflict (user_id, source_key) do nothing returning points`,
        [userId, source, sourceKey, date, points]
      );
    } else {
      return res.status(400).json({ error: 'Choose a daily reward to claim.' });
    }

    if (!inserted.rowCount) {
      const existing = await pool.query(
        'select 1 from public.player_point_events where user_id = $1 and source_key = $2 limit 1',
        [userId, sourceKey]
      );
      if (existing.rowCount) return res.status(409).json({ error: 'You have already collected this reward today.' });
      return res.status(409).json({ error: 'Finish the mission before claiming its points.' });
    }
    const tasks = await readTasks(pool, userId, date);
    return res.status(200).json({ claimed: true, points: Number(inserted.rows[0].points), totalPoints: tasks.totalPoints, tasks });
  } catch (error) {
    return sendApiError(res, error);
  }
}
