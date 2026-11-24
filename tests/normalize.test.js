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

test('calculates edit distance', () => {
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
});

test('finds exact and small-typo matches', () => {
  const songs = ['Bohemian Rhapsody', 'Another One Bites the Dust'];
  assert.equal(lookup('bohemian rhapsody', songs, key), 'Bohemian Rhapsody');
  assert.equal(lookup('bohemian rhapsdy', songs, key), 'Bohemian Rhapsody');
});

test('does not fuzzy-match very short guesses', () => {
  const bands = ['ABBA', 'Queen'];
  assert.equal(lookup('Qeen', bands, key), null);
});
