import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_DECORATIONS, getBuiltInDecorationImage } from '../src/lib/built-in-decorations.js';

test('built-in decoration catalogue contains all eight supported presets', () => {
  assert.equal(PRESET_DECORATIONS.length, 8);
  assert.equal(new Set(PRESET_DECORATIONS.map((item) => item.id)).size, 8);
  for (const item of PRESET_DECORATIONS) {
    assert.ok(item.id);
    assert.ok(item.name);
    assert.ok(item.subtitle);
    assert.ok(item.description);
  }
});

test('each built-in decoration returns a valid transparent SVG data URL', () => {
  for (const item of PRESET_DECORATIONS) {
    const dataUrl = getBuiltInDecorationImage(item.id);
    assert.match(dataUrl, /^data:image\/svg\+xml;charset=utf-8,/);
    const svg = decodeURIComponent(dataUrl.split(',')[1]);
    assert.match(svg, /<svg\b/);
    assert.match(svg, /viewBox="0 0 512 512"/);
    assert.match(svg, /fill="none"/);
    assert.match(svg, /<circle cx="256" cy="256" r="190" fill="none"/);
  }
});

test('unknown preset IDs do not produce an image', () => {
  assert.equal(getBuiltInDecorationImage('not-a-decoration'), '');
  assert.equal(getBuiltInDecorationImage(''), '');
});
