import type { TraceFormat } from './types';

interface DetectResult {
  format: TraceFormat;
  data: unknown[];
}

/**
 * Type guard: checks whether the value is a non-null object (not an array).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Unwrap the raw JSON into a flat array of objects.
 * Accepts a top-level array OR an object with a `data` array property.
 */
function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (isRecord(raw) && Array.isArray(raw['data'])) {
    return raw['data'] as unknown[];
  }
  throw new Error(
    'Unrecognized input shape: expected a JSON array or an object with a "data" array property.',
  );
}

/**
 * Detect whether a single run/trace object looks like LangSmith format.
 *
 * LangSmith runs have `run_type` AND (`dotted_order` OR `trace_id`).
 */
function isLangSmithRun(obj: unknown): boolean {
  if (!isRecord(obj)) return false;
  const hasRunType = typeof obj['run_type'] === 'string';
  const hasDottedOrder = typeof obj['dotted_order'] === 'string';
  const hasTraceId = typeof obj['trace_id'] === 'string';
  return hasRunType && (hasDottedOrder || hasTraceId);
}

/**
 * Detect whether a single trace object looks like LangFuse format.
 *
 * LangFuse traces have an `observations` array, OR objects with a `traceId` field.
 */
function isLangFuseTrace(obj: unknown): boolean {
  if (!isRecord(obj)) return false;
  if (Array.isArray(obj['observations'])) return true;
  if (typeof obj['traceId'] === 'string') return true;
  return false;
}

/**
 * Auto-detect trace format by sniffing JSON fields on the first element.
 *
 * @throws Error on empty data, non-object elements, or unrecognized format.
 */
export function detectFormat(rawJson: unknown): DetectResult {
  const data = extractArray(rawJson);

  if (data.length === 0) {
    throw new Error('Empty trace data: the file contains no trace records.');
  }

  const sample = data[0];

  if (!isRecord(sample)) {
    throw new Error(
      'Invalid trace data: expected array elements to be objects.',
    );
  }

  if (isLangSmithRun(sample)) {
    return { format: 'langsmith', data };
  }

  if (isLangFuseTrace(sample)) {
    return { format: 'langfuse', data };
  }

  throw new Error(
    'Unrecognized trace format: could not identify LangSmith or LangFuse fields. ' +
      'LangSmith runs require "run_type" with "dotted_order" or "trace_id". ' +
      'LangFuse traces require an "observations" array or a "traceId" field.',
  );
}
