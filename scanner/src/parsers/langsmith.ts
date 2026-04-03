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
 * Safely extract a number field, returning undefined if absent or wrong type.
 */
function num(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key];
  return typeof val === 'number' ? val : undefined;
}

/**
 * Build token usage from a LangSmith run object.
 */
function extractTokens(run: Record<string, unknown>): TokenUsage {
  return {
    input: num(run, 'prompt_tokens'),
    output: num(run, 'completion_tokens'),
    total: num(run, 'total_tokens'),
  };
}

/**
 * Build cost usage from a LangSmith run object.
 */
function extractCost(run: Record<string, unknown>): CostUsage {
  return {
    input: num(run, 'prompt_cost'),
    output: num(run, 'completion_cost'),
    total: num(run, 'total_cost'),
  };
}

/**
 * Build metadata from the `extra` field, falling back to an empty object.
 */
function extractMetadata(run: Record<string, unknown>): Record<string, unknown> {
  const extra = run['extra'];
  if (isRecord(extra)) {
    return { ...extra };
  }
  return {};
}

/**
 * Extract tool calls from sibling runs that have run_type === 'tool'
 * and share the same trace_id.
 */
function extractToolCalls(
  traceId: string | null,
  allRuns: Record<string, unknown>[],
): ToolCall[] {
  if (traceId === null) return [];

  return allRuns
    .filter((r) => str(r, 'run_type') === 'tool' && str(r, 'trace_id') === traceId)
    .map((r) => ({
      name: str(r, 'name') ?? 'unknown',
      input: r['inputs'] ?? null,
      output: r['outputs'] ?? null,
      error: str(r, 'error'),
      timestamp: str(r, 'start_time'),
    }));
}

/**
 * Convert a single validated LangSmith run into a NormalizedTrace.
 */
function parseRun(
  run: Record<string, unknown>,
  toolCalls: ToolCall[],
): NormalizedTrace {
  const tags = Array.isArray(run['tags']) ? run['tags'] : [];
  const metadata = extractMetadata(run);

  if (tags.length > 0) {
    metadata['tags'] = tags;
  }

  return {
    id: str(run, 'id') ?? '',
    traceId: str(run, 'trace_id') ?? str(run, 'id') ?? '',
    timestamp: str(run, 'start_time'),
    endTimestamp: str(run, 'end_time'),
    agentId: str(run, 'name'),
    agentType: str(run, 'run_type'),
    input: run['inputs'] ?? null,
    output: run['outputs'] ?? null,
    error: str(run, 'error'),
    toolCalls,
    tokens: extractTokens(run),
    cost: extractCost(run),
    metadata,
    parentId: str(run, 'parent_run_id'),
  };
}

/**
 * Parse an array of LangSmith Run objects into NormalizedTrace[].
 *
 * Tool runs (run_type === 'tool') are attached as toolCalls on their
 * parent chain/llm runs rather than becoming standalone traces.
 */
export function parseLangSmith(runs: unknown[]): NormalizedTrace[] {
  const validRuns = runs.filter(isRecord);
  const results: NormalizedTrace[] = [];

  for (const run of validRuns) {
    const runType = str(run, 'run_type');

    // Skip tool runs — they are collected as toolCalls on their parent
    if (runType === 'tool') continue;

    const traceId = str(run, 'trace_id');
    const toolCalls = extractToolCalls(traceId, validRuns);
    results.push(parseRun(run, toolCalls));
  }

  return results;
}
