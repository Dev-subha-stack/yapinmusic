const CACHE_PREFIX = 'yapin:music-info:v2:';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 10000;
function readCache(key) {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || Date.now() - entry.savedAt > CACHE_TTL) {
      window.localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch (error) { return null; }
}
function writeCache(key, value) {
  try { window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), value })); }
  catch (error) { /* Search works without a cache. */ }
}
async function getJson(url) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT) : null;
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : {});
    if (!response.ok) throw new Error('Music information service returned ' + response.status);
    return await response.json();
  } finally { if (timeout) clearTimeout(timeout); }
}
async function cached(cacheKey, loader) {
  const saved = readCache(cacheKey);
  if (saved !== null) return saved;
  const value = await loader();
  writeCache(cacheKey, value);
  return value;
}
function normalized(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\p{M}]/gu, '');
}
function words(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().split(/[^\p{L}\p{N}\p{M}]+/u).filter(Boolean);
}
const GENERIC_WORDS = new Set(['the', 'band', 'artist', 'musician', 'singer', 'music', 'group', 'indian', 'song', 'songs']);
function titleRelevance(query, title) {
  const q = normalized(query.replace(/\b(band|artist|musician|singer|music|group|indian)\b/gi, ' '));
  const t = normalized(title);
  if (!q || !t) return 0;
  if (q === t) return 100;
  if (t.startsWith(q)) return 92;
  if (q.startsWith(t) && t.length >= 4) return 82;
  const queryWords = words(query).filter((word) => !GENERIC_WORDS.has(word));
  const titleWords = words(title);
  if (!queryWords.length) return 0;
  const matched = queryWords.filter((word) => titleWords.some((candidate) =>
    candidate === word || candidate.startsWith(word) || word.startsWith(candidate))).length;
  const coverage = matched / queryWords.length;
  if (coverage === 1) return 78;
  if (coverage >= 0.75 && queryWords.length >= 2) return 62;
  return 0;
}
export function searchBandInfo(query) {
  const clean = String(query || '').trim();
  if (!clean) return Promise.resolve(null);
  const cacheKey = 'band:' + clean.toLocaleLowerCase();
  return cached(cacheKey, async () => {
    const params = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: clean, gsrnamespace: '0', gsrlimit: '10',
      prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', pithumbsize: '480',
      inprop: 'url', format: 'json', formatversion: '2', origin: '*'
    });
    const data = await getJson('https://en.wikipedia.org/w/api.php?' + params.toString());
    const pages = (data.query && data.query.pages) || [];
    const ranked = pages.map((page) => ({ page, score: titleRelevance(clean, page.title || '') }))
      .filter((entry) => entry.score >= 62 && entry.page.extract)
      .sort((a, b) => b.score - a.score || (a.page.index || 999) - (b.page.index || 999));
    if (!ranked.length) return null;
    const page = ranked[0].page;
    return {
      title: page.title || clean,
      description: page.description || '',
      extract: page.extract || '',
      image: page.thumbnail && page.thumbnail.source ? page.thumbnail.source : '',
      url: page.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent((page.title || clean).replace(/ /g, '_')))
    };
  });
}
export function searchSongInfo(query) {
  const clean = String(query || '').trim();
  if (!clean) return Promise.resolve([]);
  const cacheKey = 'song:' + clean.toLocaleLowerCase();
  return cached(cacheKey, async () => {
    const params = new URLSearchParams({ term: clean, entity: 'song', limit: '35', country: 'IN' });
    const data = await getJson('https://itunes.apple.com/search?' + params.toString());
    const queryWords = words(clean).filter((word) => !GENERIC_WORDS.has(word));
    const results = (data.results || []).filter((item) => item.kind === 'song' || item.wrapperType === 'track');
    const ranked = results.map((item) => {
      const title = item.trackName || '', artist = item.artistName || '', album = item.collectionName || '';
      const all = normalized(title + ' ' + artist + ' ' + album);
      const titleKey = normalized(title), queryKey = normalized(clean);
      let score = 0;
      if (queryKey && titleKey === queryKey) score = 100;
      else if (queryKey && titleKey.startsWith(queryKey)) score = 92;
      else if (queryKey && all.includes(queryKey)) score = 84;
      else if (queryWords.length) {
        const fieldWords = words(title + ' ' + artist + ' ' + album);
        const matched = queryWords.filter((word) => fieldWords.some((candidate) =>
          candidate === word || candidate.startsWith(word) || word.startsWith(candidate))).length;
        const coverage = matched / queryWords.length;
        score = coverage === 1 ? 78 : coverage >= 0.75 && queryWords.length >= 2 ? 62 : 0;
      }
      return { item, score };
    }).filter((entry) => entry.score >= 62).sort((a, b) => b.score - a.score);
    const seen = new Set();
    return ranked.filter(({ item }) => {
      const id = item.trackId || normalized((item.trackName || '') + ' ' + (item.artistName || ''));
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 8).map(({ item }) => ({
      title: item.trackName || 'Unknown track', artist: item.artistName || 'Unknown artist',
      album: item.collectionName || '', releaseDate: item.releaseDate || '',
      genre: item.primaryGenreName || '', duration: item.trackTimeMillis || 0,
      artwork: item.artworkUrl100 || '', url: item.trackViewUrl || ''
    }));
  });
}
