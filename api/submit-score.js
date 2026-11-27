import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';

const POINTS = { easy: 100, medium: 150, hard: 200 };

function validDate(value) {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function todayInIndia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { userId } = await requireNeonUser(req);
    const body = req.body || {};
    const gameMode = body.gameMode;
    const difficulty = body.difficulty;
    const won = body.won;
    const guessesUsed = Number(body.guessesUsed);
    const puzzleDate = body.puzzleDate;
    const roundType = body.roundType === 'random' ? 'random' : 'daily';
    const roundId = typeof body.roundId === 'string' ? body.roundId.trim() : '';

    if (gameMode !== 'song' && gameMode !== 'band') {
      return res.status(400).json({ error: 'Invalid game mode.' });
    }
    if (!Object.prototype.hasOwnProperty.call(POINTS, difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty.' });
    }
    if (typeof won !== 'boolean') {
      return res.status(400).json({ error: 'Invalid result.' });
    }
    const maxGuesses = gameMode === 'song' ? 12 : 9;
    if (!Number.isInteger(guessesUsed) || guessesUsed < 0 || guessesUsed > maxGuesses) {
      return res.status(400).json({ error: 'Invalid number of guesses.' });
    }
    if (!validDate(puzzleDate)) {
      return res.status(400).json({ error: 'Invalid round date.' });
    }

    if (roundType === 'random') {
      if (!/^[A-Za-z0-9_-]{12,100}$/.test(roundId)) {
        return res.status(400).json({ error: 'A valid Random round ID is required.' });
      }
      if (puzzleDate !== todayInIndia()) {
        return res.status(400).json({ error: 'Only Random rounds played today can be ranked.' });
      }
    } else {
      const now = new Date();
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const submittedUtc = Date.parse(puzzleDate + 'T00:00:00.000Z');
      const dayDistance = Math.abs(Math.round((todayUtc - submittedUtc) / 86400000));
      if (dayDistance > 1) {
        return res.status(400).json({ error: "Only today's Daily puzzle can be ranked." });
      }
    }

    const pool = getPool();
    const profile = await pool.query(
      'select 1 from public.player_profiles where user_id = $1',
      [userId]
    );
    if (!profile.rowCount) {
      return res.status(409).json({ error: 'Choose your public player name before submitting scores.' });
    }

    const points = won ? POINTS[difficulty] : 0;
    await pool.query(
      `insert into public.game_scores
        (user_id, game_mode, difficulty, score, won, guesses_used, puzzle_date, round_type, round_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, gameMode, difficulty, points, won, guessesUsed, puzzleDate, roundType, roundType === 'random' ? roundId : null]
    );

    return res.status(200).json({ saved: true, points, roundType });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(200).json({
        saved: true,
        duplicate: true,
        points: 0,
        error: 'This round has already been submitted.'
      });
    }
    return sendApiError(res, error);
  }
}
