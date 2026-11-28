import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSpotifyLink } from '../src/lib/spotify-links.js';

test('accepts direct Spotify track links and strips tracking parameters', () => {
  assert.equal(
    normalizeSpotifyLink('https://open.spotify.com/track/abc123?si=tracking', 'track'),
    'https://open.spotify.com/track/abc123'
  );
});

test('accepts direct Spotify playlist links', () => {
  assert.equal(
    normalizeSpotifyLink('https://open.spotify.com/playlist/xyz789', 'playlist'),
    'https://open.spotify.com/playlist/xyz789'
  );
});

test('rejects non-Spotify, non-HTTPS and mismatched links', () => {
  assert.equal(normalizeSpotifyLink('https://example.com/track/abc123', 'track'), null);
  assert.equal(normalizeSpotifyLink('http://open.spotify.com/track/abc123', 'track'), null);
  assert.equal(normalizeSpotifyLink('https://open.spotify.com/playlist/abc123', 'track'), null);
  assert.equal(normalizeSpotifyLink('https://open.spotify.com/track/abc123', 'playlist'), null);
  assert.equal(normalizeSpotifyLink('javascript:alert(1)', 'track'), null);
});
