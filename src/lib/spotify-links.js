// Accept only direct Spotify track and playlist share links; no Spotify API is called.
export function normalizeSpotifyLink(value, expectedType) {
  if (!['track', 'playlist'].includes(expectedType)) return null;
  try {
    const parsed = new URL(String(value || '').trim());
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'open.spotify.com' || parsed.port || parsed.username || parsed.password) return null;
    const match = parsed.pathname.match(/^\/(track|playlist)\/([A-Za-z0-9]+)\/?$/);
    if (!match || match[1] !== expectedType) return null;
    return 'https://open.spotify.com/' + match[1] + '/' + match[2];
  } catch {
    return null;
  }
}
