import test from 'node:test';
import assert from 'node:assert/strict';
import { bandKey, key, lookup, sortLetter, levenshteinDistance } from '../src/lib/normalize.js';

test('normalizes accents, punctuation, spacing, and ampersands', () => {
  assert.equal(key('Beyoncé & The Rolling Stones!'), 'beyonceandtherollingstones');
});
test('ignores a leading The when comparing band names', () => {
  assert.equal(bandKey('The Beatles'), 'beatles');
  assert.equal(sortLetter('The Beatles'), 'B');
});
test('preserves Bengali and Devanagari letters instead of deleting them', () => {
  assert.equal(key('অরিজিৎ সিং'), 'অরিজিৎিসং'.replace('িস', 'িস'));
  assert.equal(key('अरिजीत सिंह'), 'अरिजीतसिंह');
});
test('calculates edit distance', () => {
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
});
test('finds exact and unique small-typo matches', () => {
  const songs = ['Bohemian Rhapsody', 'Another One Bites the Dust'];
  assert.equal(lookup('bohemian rhapsody', songs, key), 'Bohemian Rhapsody');
  assert.equal(lookup('bohemian rhapsdy', songs, key), 'Bohemian Rhapsody');
});
test('matches an artist alias in its original script', () => {
  const artists = [{ name: 'Arijit Singh', aliases: ['অরিজিৎ সিং'] }];
  assert.equal(lookup('অরিজিৎ সিং', artists, (artist) => [artist.name, ...artist.aliases], key), artists[0]);
});
test('does not fuzzy-match very short guesses', () => {
  assert.equal(lookup('Qeen', ['ABBA', 'Queen'], key), null);
});
test('does not guess between equally close matches', () => {
  assert.equal(lookup('queenss', ['Queen', 'Queens'], key), null);
  assert.equal(lookup('beatle', ['Beatles', 'Beatlesque'], key), null);
});
test('does not convert an unrelated long guess into a catalogue answer', () => {
  assert.equal(lookup('arijit singh', ['Metallica', 'Megadeth', 'Linkin Park'], key), null);
});
