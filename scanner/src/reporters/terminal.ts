import pc from 'picocolors';
import type { GapReport, CheckResult, ReadinessGap } from '../types';

function severityColor(severity: string): (s: string) => string {
  switch (severity) {
    case 'critical': return pc.red;
    case 'high': return pc.yellow;
    case 'medium': return pc.cyan;
    default: return pc.dim;
  }
}

function statusIcon(result: CheckResult): string {
  if (result.percentage >= 100) return pc.green('[PASS]');
  if (result.percentage >= 50) return pc.yellow('[WARN]');
  return pc.red('[FAIL]');
}

function padRight(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function renderTraceQuality(results: CheckResult[]): string {
  const lines: string[] = [
    '',
    pc.bold('--- TRACE QUALITY (verified from data) ---'),
    '',
  ];

  for (const r of results) {
    const icon = statusIcon(r);
    const name = padRight(r.check.id, 24);
    const count = `${r.passed}/${r.total}`;
    const pct = r.percentage < 100 ? pc.red(`(${r.percentage}%)`) : pc.green(`(${r.percentage}%)`);
    const sev = severityColor(r.check.severity)(`[${r.check.severity}]`);
    lines.push(`  ${icon} ${name} ${count} ${pct}  ${sev}  Art. ${r.check.article}`);
  }

  return lines.join('\n');
}

function renderReadinessGaps(gaps: ReadinessGap[]): string {
  const lines: string[] = [
    '',
    pc.bold('--- READINESS GAPS (needs organizational verification) ---'),
    '',
  ];

  for (const gap of gaps) {
    const sev = severityColor(gap.definition.severity)(`[${gap.definition.severity}]`);
    lines.push(`  ${pc.yellow('[CHECK]')} ${gap.definition.id}  ${sev}  Art. ${gap.definition.article}`);
    lines.push(`          ${pc.dim(gap.definition.description.trim())}`);
    lines.push(`          ${pc.dim('> ' + gap.definition.recommendation.trim())}`);
    lines.push('');
  }

  return lines.join('\n');
}

function renderScore(report: GapReport): string {
  const tq = report.score.traceQuality;
  const rd = report.score.readiness;
  const overall = report.score.overall;

  const overallColor =
    overall === 'pass' ? pc.green : overall === 'partial' ? pc.yellow : pc.red;

  const lines = [
    '',
    pc.bold('--- SCORE ---'),
    `  Trace Quality: ${tq.passed}/${tq.total} checks passing (${tq.percentage}%)`,
    `  Readiness:     ${rd.verified}/${rd.total} verified`,
    `  Overall:       ${overallColor(overall.toUpperCase())}`,
    '',
  ];

  return lines.join('\n');
}

export function renderTerminal(report: GapReport): string {
  const meta = report.metadata;
  const domain = meta.domain ? ` | Domain: ${meta.domain}` : '';

  const header = [
    '',
    pc.bold('  AgentLedger Compliance Readiness Assessment'),
    pc.dim('  ─────────────────────────────────────────────'),
    `  Regulation: ${meta.regulation} ${meta.article}`,
    `  Traces: ${meta.traceCount}  |  Format: ${meta.format}${domain}`,
    `  Date: ${meta.date.split('T')[0]}`,
    '',
    pc.dim('  NOTE: EU AI Act Article 12 applies to high-risk AI systems'),
    pc.dim('  per Annex III. This scan evaluates trace data quality against'),
    pc.dim('  Article 12 requirements. It is not a legal compliance'),
    pc.dim('  determination.'),
  ];

  return [
    header.join('\n'),
    renderTraceQuality(report.traceQuality),
    renderReadinessGaps(report.readinessGaps),
    renderScore(report),
  ].join('\n');
}
