import { describe, it, expect } from 'vitest';
import { loadChecklist, runCheck, runEngine } from '../src/engine';
import { parseLangSmith } from '../src/parsers/langsmith';
import { parseLangFuse } from '../src/parsers/langfuse';
import type { NormalizedTrace, CheckDefinition } from '../src/types';
import langsmithComplete from './fixtures/langsmith-complete.json';
import langsmithPartial from './fixtures/langsmith-partial.json';
import langfuseComplete from './fixtures/langfuse-complete.json';

// ── loadChecklist ────────────────────────────────────────────────────

describe('loadChecklist', () => {
  it('loads the EU AI Act Article 12 checklist', () => {
    const checklist = loadChecklist('eu-ai-act-art12');
    expect(checklist.name).toContain('Article 12');
    expect(checklist.regulation).toBe('EU AI Act');
    expect(checklist.checks.length).toBeGreaterThan(0);
    expect(checklist.readiness_gaps.length).toBeGreaterThan(0);
  });

  it('throws on unknown regulation', () => {
    expect(() => loadChecklist('nonexistent-regulation')).toThrow(
      'Checklist not found',
    );
  });

  it('checklist has required metadata fields', () => {
    const checklist = loadChecklist('eu-ai-act-art12');
    expect(checklist.version).toBeTruthy();
    expect(checklist.article).toBeTruthy();
    expect(checklist.disclaimer).toBeTruthy();
  });

  it('each check has required fields', () => {
    const checklist = loadChecklist('eu-ai-act-art12');
    for (const check of checklist.checks) {
      expect(check.id).toBeTruthy();
      expect(check.rule).toBeTruthy();
      expect(check.severity).toBeTruthy();
      expect(check.article).toBeTruthy();
      expect(check.category).toBe('trace_quality');
    }
  });

  it('each readiness gap has required fields', () => {
    const checklist = loadChecklist('eu-ai-act-art12');
    for (const gap of checklist.readiness_gaps) {
      expect(gap.id).toBeTruthy();
      expect(gap.article).toBeTruthy();
      expect(gap.description).toBeTruthy();
      expect(gap.recommendation).toBeTruthy();
    }
  });
});

// ── runCheck ─────────────────────────────────────────────────────────

describe('runCheck', () => {
  const makeTrace = (overrides: Partial<NormalizedTrace> = {}): NormalizedTrace => ({
    id: 'test-1',
    traceId: 'trace-1',
    timestamp: '2026-04-01T10:00:00Z',
    endTimestamp: null,
    agentId: 'test-agent',
    agentType: 'chain',
    input: { prompt: 'hello' },
    output: { response: 'world' },
    error: null,
    toolCalls: [],
    tokens: { input: 100, output: 50, total: 150 },
    cost: {},
    metadata: {},
    parentId: null,
    ...overrides,
  });

  it('required rule passes when field is present', () => {
    const check: CheckDefinition = {
      id: 'test_required',
      field: 'timestamp',
      rule: 'required',
      severity: 'critical',
      article: '12(1)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace()]);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.percentage).toBe(100);
  });

  it('required rule fails when field is null', () => {
    const check: CheckDefinition = {
      id: 'test_required',
      field: 'agentId',
      rule: 'required',
      severity: 'critical',
      article: '12(2)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace({ agentId: null })]);
    expect(result.failed).toBe(1);
    expect(result.percentage).toBe(0);
  });

  it('error_tracking passes when error is null (no error occurred)', () => {
    const check: CheckDefinition = {
      id: 'error_tracking',
      field: 'error',
      rule: 'required',
      severity: 'high',
      article: '12(1)(a)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace({ error: null })]);
    expect(result.passed).toBe(1);
  });

  it('both_present passes when all fields exist', () => {
    const check: CheckDefinition = {
      id: 'test_both',
      fields: ['input', 'output'],
      rule: 'both_present',
      severity: 'critical',
      article: '12(2)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace()]);
    expect(result.passed).toBe(1);
  });

  it('both_present fails when one field is null', () => {
    const check: CheckDefinition = {
      id: 'test_both',
      fields: ['input', 'output'],
      rule: 'both_present',
      severity: 'critical',
      article: '12(2)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace({ output: null })]);
    expect(result.failed).toBe(1);
    expect(result.failedTraceIds).toContain('test-1');
  });

  it('non_empty_array passes when array has elements', () => {
    const check: CheckDefinition = {
      id: 'test_array',
      field: 'toolCalls',
      rule: 'non_empty_array',
      severity: 'medium',
      article: '12(2)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [
      makeTrace({ toolCalls: [{ name: 'search', input: null, output: null, error: null, timestamp: null }] }),
    ]);
    expect(result.passed).toBe(1);
  });

  it('non_empty_array fails on empty array', () => {
    const check: CheckDefinition = {
      id: 'test_array',
      field: 'toolCalls',
      rule: 'non_empty_array',
      severity: 'medium',
      article: '12(2)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, [makeTrace({ toolCalls: [] })]);
    expect(result.failed).toBe(1);
  });

  it('handles empty traces array gracefully', () => {
    const check: CheckDefinition = {
      id: 'test',
      field: 'timestamp',
      rule: 'required',
      severity: 'critical',
      article: '12(1)',
      description: 'test',
      category: 'trace_quality',
    };
    const result = runCheck(check, []);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(100);
  });
});

// ── runEngine ────────────────────────────────────────────────────────

describe('runEngine', () => {
  it('produces full report for complete LangSmith traces', () => {
    const traces = parseLangSmith(langsmithComplete);
    traces.forEach((t) => { t.metadata['source_format'] = 'langsmith'; });
    const checklist = loadChecklist('eu-ai-act-art12');
    const report = runEngine(traces, checklist);

    expect(report.metadata.regulation).toBe('EU AI Act');
    expect(report.metadata.traceCount).toBe(traces.length);
    expect(report.traceQuality.length).toBeGreaterThan(0);
    expect(report.readinessGaps.length).toBeGreaterThan(0);
    expect(report.score.overall).toBe('pass');
  });

  it('produces partial verdict for incomplete traces', () => {
    const traces = parseLangSmith(langsmithPartial);
    traces.forEach((t) => { t.metadata['source_format'] = 'langsmith'; });
    const checklist = loadChecklist('eu-ai-act-art12');
    const report = runEngine(traces, checklist);

    // Partial traces have missing outputs → input_output_pairs check fails
    expect(report.score.overall).not.toBe('pass');
  });

  it('all readiness gaps are unverified', () => {
    const traces = parseLangSmith(langsmithComplete);
    traces.forEach((t) => { t.metadata['source_format'] = 'langsmith'; });
    const checklist = loadChecklist('eu-ai-act-art12');
    const report = runEngine(traces, checklist);

    for (const gap of report.readinessGaps) {
      expect(gap.verified).toBe(false);
    }
    expect(report.score.readiness.verified).toBe(0);
  });

  it('works with LangFuse traces', () => {
    const traces = parseLangFuse(langfuseComplete);
    traces.forEach((t) => { t.metadata['source_format'] = 'langfuse'; });
    const checklist = loadChecklist('eu-ai-act-art12');
    const report = runEngine(traces, checklist);

    expect(report.metadata.format).toBe('langfuse');
    expect(report.traceQuality.length).toBeGreaterThan(0);
  });
});
