import { describe, it, expect } from 'vitest';
import { computeEventHash, computeChainedHash } from './event-hash.util';

const baseEvent = {
  agentId: 'agent-001',
  category: 'llm_call',
  level: 'info',
  message: 'Called GPT-4o',
  timestamp: '2026-04-04T10:00:00.000Z',
  payload: { model: 'gpt-4o', tokens: 150 },
  stateBefore: null,
  stateAfter: null,
};

describe('computeEventHash', () => {
  it('produces a 64-char hex SHA-256 hash', () => {
    const hash = computeEventHash(baseEvent);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input always produces same hash', () => {
    const hash1 = computeEventHash(baseEvent);
    const hash2 = computeEventHash(baseEvent);
    expect(hash1).toBe(hash2);
  });

  it('changes when event data changes (tamper detection)', () => {
    const original = computeEventHash(baseEvent);
    const tampered = computeEventHash({ ...baseEvent, message: 'Tampered message' });
    expect(original).not.toBe(tampered);
  });

  it('handles Date objects for timestamp', () => {
    const withDate = computeEventHash({
      ...baseEvent,
      timestamp: new Date('2026-04-04T10:00:00.000Z'),
    });
    const withString = computeEventHash(baseEvent);
    expect(withDate).toBe(withString);
  });

  it('handles null payload and state fields', () => {
    const hash = computeEventHash({
      ...baseEvent,
      payload: null,
      stateBefore: null,
      stateAfter: null,
    });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('computeChainedHash', () => {
  it('genesis event uses empty string prevHash', () => {
    const genesisHash = computeChainedHash(baseEvent, '');
    expect(genesisHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('chained hash differs from standalone hash', () => {
    const standalone = computeEventHash(baseEvent);
    const chained = computeChainedHash(baseEvent, '');
    // They use the same canonical data but chained appends prevHash
    // With empty prevHash, canonical + '' should differ from canonical alone
    // Actually: computeEventHash = SHA256(canonical), computeChainedHash = SHA256(canonical + prevHash)
    // When prevHash is '', both compute SHA256(canonical + ''), which equals SHA256(canonical)
    // So genesis hash EQUALS standalone hash. This is by design.
    // Let's test with a non-empty prevHash instead
    const withPrev = computeChainedHash(baseEvent, 'abc123');
    expect(standalone).not.toBe(withPrev);
  });

  it('builds a valid chain — each hash links to previous', () => {
    const events = [
      { ...baseEvent, message: 'Event 1', timestamp: '2026-04-04T10:00:00.000Z' },
      { ...baseEvent, message: 'Event 2', timestamp: '2026-04-04T10:00:01.000Z' },
      { ...baseEvent, message: 'Event 3', timestamp: '2026-04-04T10:00:02.000Z' },
    ];

    // Build chain
    let prevHash = '';
    const chain: { hash: string; prevHash: string }[] = [];

    for (const event of events) {
      const hash = computeChainedHash(event, prevHash);
      chain.push({ hash, prevHash });
      prevHash = hash;
    }

    // Verify chain integrity
    expect(chain[0].prevHash).toBe(''); // Genesis
    expect(chain[1].prevHash).toBe(chain[0].hash); // Links to event 1
    expect(chain[2].prevHash).toBe(chain[1].hash); // Links to event 2

    // All hashes are unique
    const hashes = chain.map(c => c.hash);
    expect(new Set(hashes).size).toBe(3);
  });

  it('detects tampering — modifying event data breaks chain verification', () => {
    const event1 = { ...baseEvent, message: 'Original event' };
    const hash1 = computeChainedHash(event1, '');

    const event2 = { ...baseEvent, message: 'Second event' };
    const hash2 = computeChainedHash(event2, hash1);

    // Tamper with event1 data and recompute
    const tamperedEvent1 = { ...baseEvent, message: 'TAMPERED event' };
    const tamperedHash1 = computeChainedHash(tamperedEvent1, '');

    // The tampered hash should NOT match the original
    expect(tamperedHash1).not.toBe(hash1);

    // Recomputing event2's hash with the tampered prevHash should differ
    const recomputedHash2 = computeChainedHash(event2, tamperedHash1);
    expect(recomputedHash2).not.toBe(hash2);
  });

  it('is sensitive to prevHash — different prevHash produces different result', () => {
    const hashA = computeChainedHash(baseEvent, 'aaaa');
    const hashB = computeChainedHash(baseEvent, 'bbbb');
    expect(hashA).not.toBe(hashB);
  });

  it('handles payload with nested objects deterministically', () => {
    const eventA = {
      ...baseEvent,
      payload: { b: 2, a: 1, nested: { z: 26, a: 1 } },
    };
    const eventB = {
      ...baseEvent,
      payload: { a: 1, b: 2, nested: { a: 1, z: 26 } },
    };
    // Keys in different order should produce same hash (canonical stringify)
    const hashA = computeChainedHash(eventA, '');
    const hashB = computeChainedHash(eventB, '');
    expect(hashA).toBe(hashB);
  });
});
