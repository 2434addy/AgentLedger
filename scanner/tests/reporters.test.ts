import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { renderTerminal } from '../src/reporters/terminal';
import { renderJson } from '../src/reporters/json';
import { renderPdf } from '../src/reporters/pdf';
import { parseLangSmith } from '../src/parsers/langsmith';
import { loadChecklist, runEngine } from '../src/engine';
import type { GapReport } from '../src/types';
import langsmithComplete from './fixtures/langsmith-complete.json';
import langsmithPartial from './fixtures/langsmith-partial.json';

function buildReport(fixture: unknown[]): GapReport {
  const traces = parseLangSmith(fixture);
  traces.forEach((t) => { t.metadata['source_format'] = 'langsmith'; });
  const checklist = loadChecklist('eu-ai-act-art12');
  return runEngine(traces, checklist);
}

describe('renderTerminal', () => {
  it('includes the Annex III disclaimer', () => {
    const report = buildReport(langsmithComplete);
    const output = renderTerminal(report);
    expect(output).toContain('Annex III');
    expect(output).toContain('not a legal compliance');
  });

  it('shows PASS for all-passing checks', () => {
    const report = buildReport(langsmithComplete);
    const output = renderTerminal(report);
    expect(output).toContain('[PASS]');
    expect(output).toContain('TRACE QUALITY');
  });

  it('shows FAIL for failing checks', () => {
    const report = buildReport(langsmithPartial);
    const output = renderTerminal(report);
    // Partial has missing outputs → WARN or FAIL
    expect(output).toMatch(/\[WARN\]|\[FAIL\]/);
  });

  it('shows readiness gaps section', () => {
    const report = buildReport(langsmithComplete);
    const output = renderTerminal(report);
    expect(output).toContain('READINESS GAPS');
    expect(output).toContain('[CHECK]');
    expect(output).toContain('retention_compliance');
  });

  it('shows score summary', () => {
    const report = buildReport(langsmithComplete);
    const output = renderTerminal(report);
    expect(output).toContain('SCORE');
    expect(output).toContain('Trace Quality');
    expect(output).toContain('Readiness');
  });

  it('shows domain when provided', () => {
    const report = buildReport(langsmithComplete);
    report.metadata.domain = 'healthcare';
    const output = renderTerminal(report);
    expect(output).toContain('healthcare');
  });
});

describe('renderJson', () => {
  it('produces valid JSON', () => {
    const report = buildReport(langsmithComplete);
    const jsonStr = renderJson(report);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.metadata).toBeDefined();
    expect(parsed.traceQuality).toBeDefined();
    expect(parsed.readinessGaps).toBeDefined();
    expect(parsed.score).toBeDefined();
  });

  it('preserves all check results', () => {
    const report = buildReport(langsmithComplete);
    const jsonStr = renderJson(report);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.traceQuality.length).toBe(report.traceQuality.length);
    expect(parsed.readinessGaps.length).toBe(report.readinessGaps.length);
  });

  it('includes score breakdown', () => {
    const report = buildReport(langsmithComplete);
    const jsonStr = renderJson(report);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.score.traceQuality.passed).toBeDefined();
    expect(parsed.score.readiness.verified).toBeDefined();
    expect(parsed.score.overall).toBeDefined();
  });
});

describe('renderPdf', () => {
  const tmpDir = os.tmpdir();
  const pdfPath = path.join(tmpDir, `agentledger-test-${Date.now()}.pdf`);

  afterEach(() => {
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  });

  it('generates a PDF file', async () => {
    const report = buildReport(langsmithComplete);
    const result = await renderPdf(report, pdfPath);
    expect(result).toBe(pdfPath);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });

  it('generates a non-empty PDF', async () => {
    const report = buildReport(langsmithComplete);
    await renderPdf(report, pdfPath);
    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('works with partial/failing report', async () => {
    const report = buildReport(langsmithPartial);
    await renderPdf(report, pdfPath);
    expect(fs.existsSync(pdfPath)).toBe(true);
    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});
