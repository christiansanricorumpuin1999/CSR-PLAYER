import { parseCommand, parseTimeInput } from './commandParser';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

describe('parseCommand', () => {
  test('accepts a command with text', () => {
    const r = parseCommand('/play midnight city');
    assert.deepEqual(r, { ok: true, name: 'play', text: 'midnight city' });
  });

  test('rejects missing required text', () => {
    assert.equal(parseCommand('/play').ok, false);
    assert.equal(parseCommand('/search   ').ok, false);
  });

  test('rejects arguments on no-argument commands', () => {
    assert.equal(parseCommand('/pause now').ok, false);
  });

  test('suggests close matches for unknown commands', () => {
    const r = parseCommand('/pla');
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.error.includes('/play'));
  });

  test('requires a leading slash', () => {
    assert.equal(parseCommand('pause').ok, false);
  });

  test('validates volume range', () => {
    assert.equal(parseCommand('/volume 70').ok, true);
    assert.equal(parseCommand('/volume 101').ok, false);
    assert.equal(parseCommand('/volume abc').ok, false);
  });

  test('maps loop modes to repeat modes', () => {
    assert.deepEqual(parseCommand('/loop track'), { ok: true, name: 'loop', text: 'track', loop: 'one' });
    assert.deepEqual(parseCommand('/loop queue'), { ok: true, name: 'loop', text: 'queue', loop: 'all' });
    assert.equal(parseCommand('/loop forever').ok, false);
  });

  test('validates remove position', () => {
    assert.equal(parseCommand('/remove 0').ok, false);
    assert.equal(parseCommand('/remove 3').ok, true);
  });
});

describe('parseTimeInput', () => {
  test('parses seconds and minutes:seconds', () => {
    assert.equal(parseTimeInput('90'), 90);
    assert.equal(parseTimeInput('1:30'), 90);
    assert.equal(parseTimeInput('1:02:05'), 3725);
  });

  test('rejects malformed times', () => {
    assert.equal(parseTimeInput('1:75'), null);
    assert.equal(parseTimeInput('-5'), null);
    assert.equal(parseTimeInput('abc'), null);
  });
});
