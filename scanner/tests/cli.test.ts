import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '..', 'dist', 'index.js');
const FIXTURES = path.resolve(__dirname, 'fixtures');

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      cwd: os.tmpdir(),
      timeout: 15000,
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      exitCode: execError.status ?? 1,
    };
  }
}

describe('CLI integration', () => {
  const tmpDir = os.tmpdir();

  afterEach(() => {
    // Clean up generated files
    for (const f of ['agentledger-report.json', 'agentledger-report.pdf']) {
      const p = path.join(tmpDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  it('exits 0 for passing traces', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} -o terminal`);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('PASS');
  });

  it('exits 1 for traces with gaps', () => {
    const fixture = path.join(FIXTURES, 'langsmith-partial.json');
    const result = run(`-f ${fixture} -o terminal`);
    expect(result.exitCode).toBe(1);
  });

  it('exits 2 for file not found', () => {
    const result = run('-f /nonexistent/file.json');
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('File not found');
  });

  it('exits 2 for invalid JSON', () => {
    const badFile = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(badFile, '{not valid json}', 'utf-8');
    const result = run(`-f ${badFile}`);
    expect(result.exitCode).toBe(2);
    fs.unlinkSync(badFile);
  });

  it('exits 2 for empty trace file', () => {
    const emptyFile = path.join(FIXTURES, 'empty.json');
    const result = run(`-f ${emptyFile}`);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Empty trace data');
  });

  it('auto-detects LangFuse format', () => {
    const fixture = path.join(FIXTURES, 'langfuse-complete.json');
    const result = run(`-f ${fixture} -o terminal`);
    expect(result.stdout).toContain('langfuse');
  });

  it('respects --format override', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} --format langsmith -o terminal`);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('langsmith');
  });

  it('generates JSON output', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} -o json --out-dir ${tmpDir}`);
    expect(result.exitCode).toBe(0);

    const jsonPath = path.join(tmpDir, 'agentledger-report.json');
    expect(fs.existsSync(jsonPath)).toBe(true);

    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(report.metadata).toBeDefined();
    expect(report.score).toBeDefined();
  });

  it('generates PDF output', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} -o pdf --out-dir ${tmpDir}`);
    expect(result.exitCode).toBe(0);

    const pdfPath = path.join(tmpDir, 'agentledger-report.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
  });

  it('shows --version', () => {
    const result = run('--version');
    expect(result.stdout).toContain('0.1.0');
  });

  it('shows --help', () => {
    const result = run('--help');
    expect(result.stdout).toContain('agentledger-scan');
    expect(result.stdout).toContain('--file');
  });

  it('shows Annex III disclaimer in terminal output', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} -o terminal`);
    expect(result.stdout).toContain('Annex III');
  });

  it('accepts --domain flag', () => {
    const fixture = path.join(FIXTURES, 'langsmith-complete.json');
    const result = run(`-f ${fixture} -o terminal --domain healthcare`);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('healthcare');
  });
});
