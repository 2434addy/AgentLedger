import { describe, it, expect } from 'vitest';
import { parseLangSmith } from '../src/parsers/langsmith';
import { parseLangFuse } from '../src/parsers/langfuse';
import langsmithComplete from './fixtures/langsmith-complete.json';
import langsmithPartial from './fixtures/langsmith-partial.json';
import langfuseComplete from './fixtures/langfuse-complete.json';
import langfusePartial from './fixtures/langfuse-partial.json';

describe('parseLangSmith', () => {
  it('parses complete runs, excluding tool runs', () => {
    const traces = parseLangSmith(langsmithComplete);
    // 3 runs total: chain + llm + tool. Tool is excluded → 2 traces.
    expect(traces).toHaveLength(2);
  });

  it('attaches tool calls to parent traces', () => {
    const traces = parseLangSmith(langsmithComplete);
    const chainRun = traces.find((t) => t.agentType === 'chain');
    expect(chainRun).toBeDefined();
    expect(chainRun!.toolCalls.length).toBeGreaterThan(0);
    expect(chainRun!.toolCalls[0].name).toBeTruthy();
  });

  it('maps all required fields on complete runs', () => {
    const traces = parseLangSmith(langsmithComplete);
    for (const trace of traces) {
      expect(trace.id).toBeTruthy();
      expect(trace.traceId).toBeTruthy();
      expect(trace.timestamp).toBeTruthy();
      expect(trace.agentId).toBeTruthy();
      expect(trace.agentType).toBeTruthy();
      expect(trace.input).not.toBeUndefined();
    }
  });

  it('preserves null outputs on partial runs', () => {
    const traces = parseLangSmith(langsmithPartial);
    const nullOutput = traces.find((t) => t.output === null);
    expect(nullOutput).toBeDefined();
  });

  it('handles missing token counts gracefully', () => {
    const traces = parseLangSmith(langsmithPartial);
    for (const trace of traces) {
      expect(trace.tokens).toBeDefined();
      // Missing tokens should be undefined, not crash
      expect(() => trace.tokens.input).not.toThrow();
    }
  });

  it('extracts metadata from extra field', () => {
    const traces = parseLangSmith(langsmithComplete);
    const chainRun = traces.find((t) => t.agentType === 'chain');
    expect(chainRun!.metadata).toBeDefined();
  });

  it('returns empty array for empty input', () => {
    const traces = parseLangSmith([]);
    expect(traces).toHaveLength(0);
  });

  it('skips non-object elements', () => {
    const traces = parseLangSmith([null, 'string', 42, ...langsmithComplete]);
    // Should only parse valid objects, skip nulls/strings/numbers
    expect(traces.length).toBeGreaterThan(0);
  });
});

describe('parseLangFuse', () => {
  it('creates one trace per observation for complete traces', () => {
    const traces = parseLangFuse(langfuseComplete);
    // 1 trace with 3 observations → 3 normalized traces
    expect(traces).toHaveLength(3);
  });

  it('maps observation types correctly', () => {
    const traces = parseLangFuse(langfuseComplete);
    const types = traces.map((t) => t.agentType);
    expect(types).toContain('GENERATION');
    expect(types).toContain('SPAN');
    expect(types).toContain('EVENT');
  });

  it('extracts token usage from GENERATION observations', () => {
    const traces = parseLangFuse(langfuseComplete);
    const gen = traces.find((t) => t.agentType === 'GENERATION');
    expect(gen).toBeDefined();
    expect(gen!.tokens.input).toBeGreaterThan(0);
    expect(gen!.tokens.output).toBeGreaterThan(0);
  });

  it('creates trace-level entry when no observations', () => {
    const traces = parseLangFuse(langfusePartial);
    // langfusePartial has: 1 trace with 1 obs + 1 trace with no obs
    const traceLevelEntries = traces.filter((t) => t.agentType === null);
    expect(traceLevelEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('handles null input/output on observations', () => {
    const traces = parseLangFuse(langfusePartial);
    // Should parse without crashing
    expect(traces.length).toBeGreaterThan(0);
  });

  it('preserves traceId from parent trace', () => {
    const traces = parseLangFuse(langfuseComplete);
    const parentTraceId = (langfuseComplete[0] as { id: string }).id;
    for (const trace of traces) {
      expect(trace.traceId).toBe(parentTraceId);
    }
  });

  it('returns empty array for empty input', () => {
    const traces = parseLangFuse([]);
    expect(traces).toHaveLength(0);
  });
});
