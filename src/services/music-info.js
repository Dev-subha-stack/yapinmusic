const CACHE_PREFIX = 'yapin:music-info:v1:';
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
  } catch (error) {
    return null;
  }
}

function writeCache(key, value) {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      savedAt: Date.now(),
      value
    }));
  } catch (error) {
    // The feature still works when browser storage is full or unavailable.
  }
}

async function getJson(url) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT) : null;
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : {});
    if (!response.ok) throw new Error('Music information service returned ' + response.status);
    return await response.json();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function cached(key, loader) {
  const saved = readCache(key);
  if (saved !== null) return saved;
  const value = await loader();
  writeCache(key, value);
  return value;
}

/**
 * Search Wikipedia for a band or artist biography.
 * MediaWiki's origin=* parameter enables anonymous cross-origin requests.
 */
export function searchBandInfo(query) {
  const clean = String(query || '').trim();
  if (!clean) return Promise.resolve(null);
  const cacheKey = 'band:' + clean.toLocaleLowerCase();
  return cached(cacheKey, async () => {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: clean + ' band musician',
      gsrnamespace: '0',
      gsrlimit: '5',
      prop: 'extracts|pageimages|info',
      exintro: '1',
      explaintext: '1',
      pithumbsize: '480',
      inprop: 'url',
      format: 'json',
      formatversion: '2',
      origin: '*'
    });
    params.set('explaintext', '1');
    const data = await getJson('https://en.wikipedia.org/w/api.php?' + params.toString());
    const pages = (data.query && data.query.pages) || [];
    pages.sort((a, b) => (a.index || 999) - (b.index || 999));
    const page = pages.find((item) => item.extract) || pages[0];
    if (!page) return null;
    return {
      title: page.title || clean,
      description: page.description || '',
      extract: page.extract || '',
      image: page.thumbnail && page.thumbnail.source ? page.thumbnail.source : '',
      url: page.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent((page.title || clean).replace(/ /g, '_')))
    };
  });
}

/**
 * Search Apple's public iTunes catalog for track artwork and release metadata.
 * Search only runs after a user submits a query; results are cached for seven days.
 */
export function searchSongInfo(query) {
  const clean = String(query || '').trim();
  if (!clean) return Promise.resolve([]);
  const cacheKey = 'song:' + clean.toLocaleLowerCase();
  return cached(cacheKey, async () => {
    const params = new URLSearchParams({
      term: clean,
      entity: 'song',
      limit: '6',
      country: 'IN'
    });
    const data = await getJson('https://itunes.apple.com/search?' + params.toString());
    return (data.results || []).filter((item) => item.kind === 'song' || item.wrapperType === 'track')
      .map((item) => ({
        title: item.trackName || 'Unknown track',
        artist: item.artistName || 'Unknown artist',
        album: item.collectionName || '',
        releaseDate: item.releaseDate || '',
        genre: item.primaryGenreName || '',
        duration: item.trackTimeMillis || 0,
        artwork: item.artworkUrl100 || '',
        url: item.trackViewUrl || ''
      }));
  });
}
