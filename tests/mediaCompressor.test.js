import test from 'node:test';
import assert from 'node:assert/strict';
import { isAnimatedImageBytes } from '../src/mediaCompressor.js';

test('recognises GIF image data', () => {
  assert.equal(isAnimatedImageBytes('image/gif', new Uint8Array([0x47,0x49,0x46,0x38,0x39,0x61])), true);
});
test('recognises APNG animation control chunks', () => {
  assert.equal(isAnimatedImageBytes('image/png', new Uint8Array([0,97,99,84,76,0])), true);
  assert.equal(isAnimatedImageBytes('image/png', new Uint8Array([0,73,68,65,84])), false);
});
test('recognises animated WebP frame chunks', () => {
  assert.equal(isAnimatedImageBytes('image/webp', new Uint8Array([0,65,78,73,77,0])), true);
  assert.equal(isAnimatedImageBytes('image/webp', new Uint8Array([0,86,80,56,88])), false);
});
