import { createHash } from 'crypto';

/**
 * Computes a SHA-256 hash of the canonical event data.
 * The canonical form is a deterministic JSON string of the fields
 * that must remain immutable once an event is recorded.
 */
export function computeEventHash(data: {
  agentId: string;
  category: string;
  level: string;
  message: string;
  timestamp: string | Date;
  payload?: Record<string, unknown> | null;
  stateBefore?: Record<string, unknown> | null;
  stateAfter?: Record<string, unknown> | null;
}): string {
  const canonical = JSON.stringify({
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
