import type { NormalizedTrace, ToolCall, TokenUsage, CostUsage } from '../types';

/**
 * Type guard: checks whether the value is a non-null object (not an array).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely extract a string field, returning null if absent or wrong type.
 */
function str(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  return typeof val === 'string' ? val : null;
}

/**
 * Safely extract a number from a nested record (e.g. usageDetails.input).
 */
function nestedNum(
  obj: Record<string, unknown>,
  outerKey: string,
  innerKey: string,
): number | undefined {
  const outer = obj[outerKey];
  if (!isRecord(outer)) return undefined;
  const val = outer[innerKey];
  return typeof val === 'number' ? val : undefined;
}

/**
 * Build token usage from a LangFuse observation's usageDetails.
 */
function extractTokens(obs: Record<string, unknown>): TokenUsage {
  return {
    input: nestedNum(obs, 'usageDetails', 'input'),
    output: nestedNum(obs, 'usageDetails', 'output'),
    total: nestedNum(obs, 'usageDetails', 'total'),
  };
}

/**
 * Build cost usage from a LangFuse observation's costDetails.
 */
function extractCost(obs: Record<string, unknown>): CostUsage {
  return {
    input: nestedNum(obs, 'costDetails', 'input'),
    output: nestedNum(obs, 'costDetails', 'output'),
    total: nestedNum(obs, 'costDetails', 'total'),
  };
}

/**
 * Build metadata from a LangFuse object, merging extra fields.
 */
function extractMetadata(
  obj: Record<string, unknown>,
  extraKeys: string[],
): Record<string, unknown> {
  const meta = isRecord(obj['metadata']) ? { ...obj['metadata'] as Record<string, unknown> } : {};

  for (const key of extraKeys) {
    const val = obj[key];
    if (val !== undefined && val !== null) {
      meta[key] = val;
    }
  }

  return meta;
}

/**
 * Determine the error string for an observation.
 * Uses statusMessage when level is 'ERROR'.
 */
function extractError(obs: Record<string, unknown>): string | null {
  const level = str(obs, 'level');
  if (level === 'ERROR') {
    return str(obs, 'statusMessage') ?? 'Unknown error';
  }
  return null;
}

/**
 * Convert a single LangFuse observation into a NormalizedTrace.
 */
function parseObservation(
  obs: Record<string, unknown>,
  traceId: string,
): NormalizedTrace {
  const metadata = extractMetadata(obs, [
    'modelParameters',
    'providedModelName',
  ]);

  const tags = Array.isArray(obs['tags']) ? obs['tags'] : [];
  if (tags.length > 0) {
    metadata['tags'] = tags;
  }

  return {
    id: str(obs, 'id') ?? '',
    traceId,
    timestamp: str(obs, 'startTime'),
    endTimestamp: str(obs, 'endTime'),
    agentId: str(obs, 'name'),
    agentType: str(obs, 'type'),
    input: obs['input'] ?? null,
    output: obs['output'] ?? null,
    error: extractError(obs),
    toolCalls: [],
    tokens: extractTokens(obs),
    cost: extractCost(obs),
    metadata,
    parentId: str(obs, 'parentObservationId'),
  };
}

/**
 * Convert a LangFuse trace (with no observations) into a NormalizedTrace.
 */
function parseTraceLevelOnly(trace: Record<string, unknown>): NormalizedTrace {
  const metadata = extractMetadata(trace, ['userId', 'sessionId']);

  const tags = Array.isArray(trace['tags']) ? trace['tags'] : [];
  if (tags.length > 0) {
    metadata['tags'] = tags;
  }

  return {
    id: str(trace, 'id') ?? '',
    traceId: str(trace, 'id') ?? '',
    timestamp: str(trace, 'timestamp'),
    endTimestamp: null,
    agentId: str(trace, 'name'),
    agentType: null,
    input: trace['input'] ?? null,
    output: trace['output'] ?? null,
    error: null,
    toolCalls: [],
    tokens: {},
    cost: {},
    metadata,
    parentId: null,
  };
}

/**
 * Parse an array of LangFuse Trace objects into NormalizedTrace[].
 *
 * If a trace has observations, one NormalizedTrace is created per observation.
 * If a trace has no observations, one NormalizedTrace is created from the trace itself.
 */
export function parseLangFuse(traces: unknown[]): NormalizedTrace[] {
  const results: NormalizedTrace[] = [];

  for (const raw of traces) {
    if (!isRecord(raw)) continue;

    const traceId = str(raw, 'id') ?? '';
    const observations = raw['observations'];

    if (Array.isArray(observations) && observations.length > 0) {
      for (const obs of observations) {
        if (!isRecord(obs)) continue;
        results.push(parseObservation(obs, traceId));
      }
    } else {
      results.push(parseTraceLevelOnly(raw));
    }
  }

  return results;
}
