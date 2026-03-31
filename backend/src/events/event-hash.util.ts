import { createHash } from 'crypto';

interface EventHashData {
  agentId: string;
  category: string;
  level: string;
  message: string;
  timestamp: string | Date;
  payload?: Record<string, unknown> | null;
  stateBefore?: Record<string, unknown> | null;
  stateAfter?: Record<string, unknown> | null;
}

/**
 * Deterministic JSON serialization with sorted keys.
 * PostgreSQL JSONB returns keys in sorted order, so we must sort
 * at hash time to ensure creation-time and verification-time hashes match.
 */
function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  const entries = sorted.map(
    key => JSON.stringify(key) + ':' + canonicalStringify((obj as Record<string, unknown>)[key]),
  );
  return '{' + entries.join(',') + '}';
}

/**
 * Computes a standalone SHA-256 hash of the canonical event data.
 * Used for per-event integrity verification (legacy, pre-chain events).
 */
export function computeEventHash(data: EventHashData): string {
  const canonical = canonicalStringify({
    agentId: data.agentId,
    category: data.category,
    level: data.level,
    message: data.message,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString(),
    payload: data.payload ?? null,
    stateBefore: data.stateBefore ?? null,
    stateAfter: data.stateAfter ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Computes a chained SHA-256 hash: hash = SHA256(canonical_event_data + prevHash).
 * This links each event to its predecessor, forming a tamper-evident chain.
 * Genesis events (first in an org) use empty string for prevHash.
 */
export function computeChainedHash(data: EventHashData, prevHash: string): string {
  const canonical = canonicalStringify({
    agentId: data.agentId,
    category: data.category,
    level: data.level,
    message: data.message,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString(),
    payload: data.payload ?? null,
    stateBefore: data.stateBefore ?? null,
    stateAfter: data.stateAfter ?? null,
  });
  return createHash('sha256').update(canonical + prevHash).digest('hex');
}
