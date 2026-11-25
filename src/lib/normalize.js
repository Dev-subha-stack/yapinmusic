// Shared text normalization and conservative matching helpers used by both games.
export function key(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '');
}
export function bandKey(value) {
  return key(value).replace(/^the(?=.)/, '');
}
export function sortLetter(name) {
  return bandKey(name).charAt(0).toLocaleUpperCase();
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
function valuesOf(value) {
  return Array.isArray(value) ? value : [value];
}
export function lookup(value, list, keyOf, normalize = key) {
  const normalized = normalize(value);
  if (!normalized) return null;
  const entries = list.map((item) => ({
    item,
    keys: valuesOf(keyOf(item)).map((candidate) => normalize(candidate)).filter(Boolean)
  }));
  const exact = entries.filter((entry) => entry.keys.includes(normalized));
  if (exact.length === 1) return exact[0].item;
  if (exact.length > 1) return null;
  const prefixes = entries.filter((entry) => entry.keys.some((candidate) => candidate.startsWith(normalized)));
  if (prefixes.length === 1) return prefixes[0].item;
  if (prefixes.length > 1) return null;
  if (normalized.length < 6 || !/^[a-z0-9]+$/.test(normalized)) return null;
  const maxDistance = normalized.length >= 16 ? 2 : 1;
  const matches = [];
  for (const entry of entries) {
    for (const candidate of entry.keys) {
      if (!/^[a-z0-9]+$/.test(candidate)) continue;
      if (Math.abs(candidate.length - normalized.length) > maxDistance) continue;
      const distance = levenshteinDistance(normalized, candidate);
      if (distance <= maxDistance) matches.push({ item: entry.item, distance });
    }
  }
  matches.sort((a, b) => a.distance - b.distance);
  if (!matches.length) return null;
  const best = matches[0];
  return matches.filter((match) => match.distance === best.distance).length === 1 ? best.item : null;
}
