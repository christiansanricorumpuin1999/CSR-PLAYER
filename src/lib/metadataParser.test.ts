import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitleFromFilename, parseID3v2 } from './metadataParser';

test('cleanTitleFromFilename strips extensions and cleans formatting', () => {
  assert.equal(cleanTitleFromFilename('01_Bohemian_Rhapsody.mp3'), '01 Bohemian Rhapsody');
  assert.equal(cleanTitleFromFilename('Synthwave__Sunset_Track.flac'), 'Synthwave Sunset Track');
  assert.equal(cleanTitleFromFilename('lofi-beats-study.wav'), 'lofi-beats-study');
});

test('parseID3v2 safely returns empty object for non-ID3 buffer', () => {
  const dummyBuffer = new ArrayBuffer(20);
  const result = parseID3v2(dummyBuffer);
  assert.deepEqual(result, {});
});
