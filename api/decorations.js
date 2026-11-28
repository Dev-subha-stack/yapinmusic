import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';

const PAGE_SIZE = 12;
const MAX_IMAGE_LENGTH = 360000;
const PRESET_DECORATION_IDS = new Set(['neon-orbit', 'ember-ring', 'starlight', 'sakura-bloom', 'frostline', 'emerald-leaves']);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function validImageData(value) {
  const image = String(value || '').trim();
  if (image.length < 100 || image.length > MAX_IMAGE_LENGTH) return null;
  if (!/^data:image\/(?:png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(image)) return null;
  return image;
}

async function readSummary(pool, userId) {
  if (!userId) return { activeDecorationId: null, artistBadge: false, pendingCount: 0, submissionLimit: 3 };
  const result = await pool.query(
    'select p.active_decoration_id, p.active_preset_decoration, exists (select 1 from public.player_decorations d where d.creator_id = p.user_id and d.status = $2) as artist_badge, (select count(*)::integer from public.player_decorations d where d.creator_id = p.user_id and d.status = $3) as pending_count from public.player_profiles p where p.user_id = $1 limit 1',
    [userId, 'approved', 'pending']
  );
  const row = result.rows[0] || {};
  const artistBadge = Boolean(row.artist_badge);
  return {
    activeDecorationId: row.active_decoration_id || null,
    activePresetDecoration: row.active_preset_decoration || null,
    artistBadge,
    pendingCount: Number(row.pending_count) || 0,
    submissionLimit: artistBadge ? 6 : 3
  };
}

async function readCommunity(pool, userId, page) {
  const offset = (page - 1) * PAGE_SIZE;
  const result = await pool.query(
    'select d.id, d.name, d.image_data, d.creator_id, p.username as creator_username, d.created_at, count(w.user_id)::integer as wearer_count, coalesce(bool_or(w.user_id = $1), false) as worn_by_me from public.player_decorations d join public.player_profiles p on p.user_id = d.creator_id left join public.player_profiles w on w.active_decoration_id = d.id where d.status = $2 group by d.id, p.username order by d.created_at desc limit $3 offset $4',
    [userId, 'approved', PAGE_SIZE + 1, offset]
  );
  return { items: result.rows.slice(0, PAGE_SIZE), hasMore: result.rows.length > PAGE_SIZE };
}

async function readPresetWearCounts(pool) {
  const result = await pool.query(
    'select active_preset_decoration as id, count(*)::integer as wearer_count from public.player_profiles where active_preset_decoration is not null group by active_preset_decoration'
  );
  return result.rows.reduce((counts, row) => {
    counts[row.id] = Number(row.wearer_count) || 0;
    return counts;
  }, {});
}

async function readMine(pool, userId) {
  if (!userId) return [];
  const result = await pool.query(
    'select d.id, d.name, d.image_data, d.status, d.review_note, d.created_at, count(w.user_id)::integer as wearer_count, coalesce(bool_or(w.user_id = $1), false) as worn_by_me from public.player_decorations d left join public.player_profiles w on w.active_decoration_id = d.id where d.creator_id = $1 group by d.id order by d.created_at desc limit 24',
    [userId]
  );
  return result.rows;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    try {
      let userId = null;
      try {
        userId = (await requireNeonUser(req)).userId;
      } catch (error) {
        if (Number(error && error.statusCode) !== 401) throw error;
      }
      const parsedPage = Number.parseInt(String(req.query && req.query.page || '1'), 10);
      const page = Number.isFinite(parsedPage) ? Math.max(1, Math.min(100, parsedPage)) : 1;
      const pool = getPool();
      const results = await Promise.all([
        readCommunity(pool, userId, page),
        readMine(pool, userId),
        readSummary(pool, userId),
        readPresetWearCounts(pool)
      ]);
      return res.status(200).json({
        community: results[0].items,
        hasMore: results[0].hasMore,
        page,
        mine: results[1],
        ...results[2],
        presetWearCounts: results[3]
      });
    } catch (error) {
      return sendApiError(res, error);
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { userId } = await requireNeonUser(req);
    const pool = getPool();
    const body = req.body || {};
    const action = String(body.action || '').trim();

    if (action === 'submit') {
      const name = String(body.name || '').trim();
      if (!/^[\p{L}\p{N} _.-]{2,32}$/u.test(name)) {
        throw badRequest('Name your decoration with 2–32 letters, numbers, spaces, dots, dashes or underscores.');
      }
      if (body.originalArtAttested !== true) {
        throw badRequest('Confirm that this is your own original artwork before submitting.');
      }
      const imageData = validImageData(body.imageData);
      if (!imageData) {
        throw badRequest('Upload a transparent PNG or WebP decoration under 360 KB. Use a square image at least 192×192; 512×512 is recommended.');
      }

      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [userId]);
        const profile = await client.query(
          'select exists (select 1 from public.player_decorations where creator_id = $1 and status = $2) as artist_badge, (select count(*)::integer from public.player_decorations where creator_id = $1 and status = $3) as pending_count from public.player_profiles where user_id = $1',
          [userId, 'approved', 'pending']
        );
        if (!profile.rowCount) throw badRequest('Set up your public player profile before submitting a decoration.');
        const hasArtistBadge = Boolean(profile.rows[0].artist_badge);
        const limit = hasArtistBadge ? 6 : 3;
        if (Number(profile.rows[0].pending_count) >= limit) {
          throw badRequest('You already have ' + limit + ' decorations waiting for review. Wait for a decision before submitting another.');
        }
        const inserted = await client.query(
          'insert into public.player_decorations (creator_id, name, image_data, status) values ($1, $2, $3, $4) returning id, name, status, created_at',
          [userId, name, imageData, 'pending']
        );
        await client.query('commit');
        return res.status(201).json({ decoration: inserted.rows[0], submissionLimit: limit });
      } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'wear') {
      const decorationId = String(body.decorationId || '');
      if (!validUuid(decorationId)) throw badRequest('Choose a valid decoration.');
      const result = await pool.query(
        'update public.player_profiles p set active_decoration_id = d.id, active_preset_decoration = null, updated_at = now() from public.player_decorations d where p.user_id = $1 and d.id = $2 and d.status = $3 returning p.active_decoration_id',
        [userId, decorationId, 'approved']
      );
      if (!result.rowCount) throw badRequest('That decoration is no longer available.');
      return res.status(200).json({ activeDecorationId: result.rows[0].active_decoration_id });
    }

    if (action === 'wear-preset') {
      const presetId = String(body.presetId || '').trim();
      if (!PRESET_DECORATION_IDS.has(presetId)) throw badRequest('Choose a valid included decoration.');
      await pool.query(
        'update public.player_profiles set active_decoration_id = null, active_preset_decoration = $2, updated_at = now() where user_id = $1',
        [userId, presetId]
      );
      return res.status(200).json({ activeDecorationId: null, activePresetDecoration: presetId });
    }

    if (action === 'unwear') {
      await pool.query(
        'update public.player_profiles set active_decoration_id = null, active_preset_decoration = null, updated_at = now() where user_id = $1',
        [userId]
      );
      return res.status(200).json({ activeDecorationId: null, activePresetDecoration: null });
    }

    if (action === 'withdraw') {
      const decorationId = String(body.decorationId || '');
      if (!validUuid(decorationId)) throw badRequest('Choose a valid decoration.');
      const result = await pool.query(
        'update public.player_decorations set status = $3, review_note = $4, updated_at = now() where id = $1 and creator_id = $2 and status in ($5, $6) returning id',
        [decorationId, userId, 'removed', 'Removed by creator.', 'pending', 'approved']
      );
      if (!result.rowCount) throw badRequest('That decoration could not be taken down.');
      await pool.query(
        'update public.player_profiles set active_decoration_id = null, updated_at = now() where active_decoration_id = $1',
        [decorationId]
      );
      return res.status(200).json({ removed: true });
    }

    throw badRequest('Choose a valid decoration action.');
  } catch (error) {
    return sendApiError(res, error);
  }
}
