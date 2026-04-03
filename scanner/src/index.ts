#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { detectFormat } from './detect';
import { parseLangSmith, parseLangFuse } from './parsers';
import { loadChecklist, runEngine } from './engine';
import { renderTerminal, renderJson, renderPdf } from './reporters';
import type { TraceFormat, OutputFormat, NormalizedTrace, GapReport } from './types';

const VERSION = '0.1.0';

function readTraceFile(filePath: string): unknown {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');

  if (raw.trim() === '') {
    throw new Error(`File is empty: ${resolved}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `Invalid JSON in ${resolved}. Ensure the file contains valid JSON trace data.`,
    );
  }
}

function parseTraces(
  rawData: unknown[],
  format: TraceFormat,
): NormalizedTrace[] {
  const traces =
    format === 'langsmith'
      ? parseLangSmith(rawData)
      : parseLangFuse(rawData);

  if (traces.length === 0) {
    throw new Error(
      'No traces found after parsing. The file may contain data in an unexpected structure.',
    );
  }

  // Tag each trace with source format for engine metadata inference
  for (const trace of traces) {
    trace.metadata['source_format'] = format;
  }

  return traces;
}

async function outputResults(
  report: GapReport,
  outputMode: OutputFormat,
  outDir: string,
): Promise<void> {
  const resolvedDir = path.resolve(outDir);

  if (outputMode === 'terminal' || outputMode === 'all') {
    process.stdout.write(renderTerminal(report) + '\n');
  }

  if (outputMode === 'json' || outputMode === 'all') {
    const jsonPath = path.join(resolvedDir, 'agentledger-report.json');
    fs.writeFileSync(jsonPath, renderJson(report), 'utf-8');
    if (outputMode !== 'all') {
      process.stdout.write(renderJson(report) + '\n');
    } else {
      process.stderr.write(`JSON report: ${jsonPath}\n`);
    }
  }

  if (outputMode === 'pdf' || outputMode === 'all') {
    const pdfPath = path.join(resolvedDir, 'agentledger-report.pdf');
    await renderPdf(report, pdfPath);
    process.stderr.write(`PDF report:  ${pdfPath}\n`);
  }
}

async function run(): Promise<void> {
  const program = new Command();

  program
    .name('agentledger-scan')
    .version(VERSION)
    .description(
      'EU AI Act Article 12 compliance readiness assessment for AI agent traces',
    )
    .requiredOption('-f, --file <path>', 'Path to trace export JSON file')
    .option(
      '-r, --regulation <id>',
      'Regulation checklist to use',
      'eu-ai-act-art12',
    )
    .option(
      '--format <type>',
      'Trace format (langsmith|langfuse). Auto-detected if omitted.',
    )
    .option(
      '-o, --output <type>',
      'Output format: terminal, pdf, json, or all',
      'all',
    )
    .option('--out-dir <path>', 'Output directory for PDF/JSON files', '.')
    .option('--domain <domain>', 'Domain context (e.g. healthcare, finance)')
    .parse(process.argv);

  const opts = program.opts<{
    file: string;
    regulation: string;
    format?: string;
    output: string;
    outDir: string;
    domain?: string;
  }>();

  // Validate output format
  const validOutputs = ['terminal', 'pdf', 'json', 'all'];
  if (!validOutputs.includes(opts.output)) {
    process.stderr.write(
      `Invalid output format "${opts.output}". Use: ${validOutputs.join(', ')}\n`,
    );
    process.exit(2);
  }

  // Validate format if provided
  if (opts.format && opts.format !== 'langsmith' && opts.format !== 'langfuse') {
    process.stderr.write(
      `Invalid trace format "${opts.format}". Use: langsmith, langfuse\n`,
    );
    process.exit(2);
  }

  // 1. Read the file
  const rawJson = readTraceFile(opts.file);

  // 2. Detect or use specified format
  let format: TraceFormat;
  let rawData: unknown[];

  if (opts.format) {
    format = opts.format as TraceFormat;
    rawData = Array.isArray(rawJson) ? rawJson : [rawJson];
  } else {
    const detected = detectFormat(rawJson);
    format = detected.format;
    rawData = detected.data;
  }

  // 3. Parse into normalized traces
  const traces = parseTraces(rawData, format);

  // 4. Load checklist and run engine
  const checklist = loadChecklist(opts.regulation);
  const report = runEngine(traces, checklist);

  // Inject domain if provided
  if (opts.domain) {
    report.metadata.domain = opts.domain;
  }

  // 5. Output results
  await outputResults(report, opts.output as OutputFormat, opts.outDir);

  // 6. Exit code: 0=all pass, 1=gaps found
  if (report.score.overall === 'pass') {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(2);
});
