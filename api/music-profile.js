import { getPool } from './_lib/db.js';
import { requireNeonUser, sendApiError } from './_lib/auth.js';
import { normalizeSpotifyLink } from '../src/lib/spotify-links.js';

const EMPTY_MUSIC_PROFILE = { recentTrack: null, favoriteTracks: [], playlists: [] };

function textField(value, maxLength) {
  const text = String(value || '').trim();
  return text && text.length <= maxLength ? text : null;
}

function validTrack(value, optional = false) {
  if (value == null && optional) return null;
  if (!value || typeof value !== 'object') return null;
  const title = textField(value.title, 100);
  const artist = textField(value.artist, 100);
  const url = normalizeSpotifyLink(value.url, 'track');
  return title && artist && url ? { title, artist, url } : null;
}

function validPlaylist(value) {
  if (!value || typeof value !== 'object') return null;
  const title = textField(value.title, 100);
  const url = normalizeSpotifyLink(value.url, 'playlist');
  return title && url ? { title, url } : null;
}

function validMusicProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const recentTrack = value.recentTrack == null ? null : validTrack(value.recentTrack);
  const favoriteTracks = value.favoriteTracks;
  const playlists = value.playlists;
  if (value.recentTrack != null && !recentTrack) return null;
  if (!Array.isArray(favoriteTracks) || favoriteTracks.length > 5) return null;
  if (!Array.isArray(playlists) || playlists.length > 5) return null;
  const tracks = favoriteTracks.map((track) => validTrack(track));
  const lists = playlists.map(validPlaylist);
  if (tracks.some((track) => !track) || lists.some((playlist) => !playlist)) return null;
  return { recentTrack, favoriteTracks: tracks, playlists: lists };
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
    const musicProfile = validMusicProfile(body.musicProfile);
    if (!musicProfile) {
      return res.status(400).json({
        error: 'Check your entries: use valid Spotify track or playlist share links, and add no more than 5 favourites of each type.'
      });
    }
    if (typeof body.isPublic !== 'boolean') {
      return res.status(400).json({ error: 'Choose whether to show My Music on your public profile.' });
    }

    const { rows } = await getPool().query(
      `update public.player_profiles
          set music_profile = $2::jsonb,
              music_is_public = $3,
              updated_at = now()
        where user_id = $1
        returning music_profile, music_is_public`,
      [userId, JSON.stringify(musicProfile), body.isPublic]
    );
    if (!rows[0]) {
      const error = new Error('Create your player profile before saving My Music.');
      error.statusCode = 404;
      throw error;
    }
    return res.status(200).json({
      musicProfile: rows[0].music_profile || EMPTY_MUSIC_PROFILE,
      isPublic: Boolean(rows[0].music_is_public)
    });
  } catch (error) {
    return sendApiError(res, error);
  }
}
