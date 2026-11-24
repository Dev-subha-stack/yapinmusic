// Shared text normalization and fuzzy matching helpers used by both games.
export function key(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function bandKey(value) {
  return key(value).replace(/^the(?=.)/, '');
}

export function sortLetter(name) {
  return bandKey(name).charAt(0).toUpperCase();
}

export function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  let previous = Array.from({ length: n + 1 }, (_, index) => index);

  for (let i = 1; i <= m; i += 1) {
    const current = [i];
    for (let j = 1; j <= n; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
      );
    }
    previous = current;
  }

  return previous[n];
}

function tolerance(normalizedValue) {
  return normalizedValue.length >= 12 ? 2 : normalizedValue.length >= 6 ? 1 : 0;
}

// Prefer exact matches; only accept small typos for longer answers.
export function lookup(value, list, keyOf, normalize = key) {
  const normalized = normalize(value);
  if (!normalized) return null;

  for (const item of list) {
    if (keyOf(item) === normalized) return item;
  }

  const maxDistance = tolerance(normalized);
  if (!maxDistance) return null;

  let bestMatch = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const item of list) {
    const distance = levenshteinDistance(normalized, keyOf(item));
    if (distance <= maxDistance && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = item;
    }
  }

  return bestMatch;
}
