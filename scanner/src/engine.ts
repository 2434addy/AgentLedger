import yaml from 'js-yaml';
import path from 'path';
import fs from 'fs';
import type {
  ChecklistFile,
  CheckDefinition,
  CheckResult,
  NormalizedTrace,
  GapReport,
  ReadinessGap,
  ReportScore,
  CheckRule,
} from './types';

// ── YAML Loading ──────────────────────────────────────────────────────

/** Candidate directories where checklist YAML files may live. */
function checklistPaths(regulation: string): string[] {
  return [
    // Compiled layout: dist/engine.js → ../checklists/
    path.resolve(__dirname, '..', 'checklists', `${regulation}.yaml`),
    // Source layout: src/engine.ts → ../../checklists/
    path.resolve(__dirname, '..', '..', 'checklists', `${regulation}.yaml`),
  ];
}

/**
 * Load and parse a YAML checklist for the given regulation slug.
 * @throws if the file is not found or the YAML is malformed / incomplete.
 */
export function loadChecklist(regulation: string): ChecklistFile {
  const candidates = checklistPaths(regulation);
  const filePath = candidates.find((p) => fs.existsSync(p));

  if (!filePath) {
    throw new Error(
      `Checklist not found for regulation "${regulation}". ` +
        `Searched: ${candidates.join(', ')}`
    );
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed: unknown = yaml.load(raw);

  return validateChecklist(parsed, filePath);
}

/** Validate that the parsed YAML has every required top-level field. */
function validateChecklist(
  parsed: unknown,
  filePath: string
): ChecklistFile {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Malformed YAML in ${filePath}: expected an object`);
  }

  const obj = parsed as Record<string, unknown>;
  const required = ['name', 'checks', 'readiness_gaps'] as const;

  for (const key of required) {
    if (!(key in obj)) {
      throw new Error(
        `Malformed YAML in ${filePath}: missing required field "${key}"`
      );
    }
  }

  if (!Array.isArray(obj.checks)) {
    throw new Error(`Malformed YAML in ${filePath}: "checks" must be an array`);
  }

  if (!Array.isArray(obj.readiness_gaps)) {
    throw new Error(
      `Malformed YAML in ${filePath}: "readiness_gaps" must be an array`
    );
  }

  return obj as unknown as ChecklistFile;
}

// ── Field Access ──────────────────────────────────────────────────────

/** Safely read a string-keyed field from a NormalizedTrace. */
function getTraceField(
  trace: NormalizedTrace,
  field: string
): unknown {
  return (trace as unknown as Record<string, unknown>)[field];
}

// ── Rule Evaluators ───────────────────────────────────────────────────

/** Returns true when a single value counts as "present". */
function isPresent(value: unknown): boolean {
  if (value === undefined) return false;
  // null is ONLY acceptable for the error field — but that is handled by
  // the caller (evaluateRule). For generic "required", null is absent.
  if (value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Evaluate a single rule against one trace.
 * Returns true when the trace PASSES the check.
 */
function evaluateRule(
  check: CheckDefinition,
  trace: NormalizedTrace
): boolean {
  const rule: CheckRule = check.rule;

  switch (rule) {
    case 'required':
      return evaluateRequired(check, trace);
    case 'both_present':
      return evaluateBothPresent(check, trace);
    case 'non_empty_array':
      return evaluateNonEmptyArray(check, trace);
    case 'format':
      // Future — always passes for now.
      return true;
    default: {
      // Exhaustive check — if new rules are added but not handled, this
      // will surface a compile-time error.
      const _exhaustive: never = rule;
      return _exhaustive;
    }
  }
}

/**
 * "required" — the field must exist, be non-null, and non-empty.
 *
 * Special case: the `error` field is considered present even when null,
 * because null means "no error occurred". The check only fails when the
 * field is completely absent (undefined).
 */
function evaluateRequired(
  check: CheckDefinition,
  trace: NormalizedTrace
): boolean {
  const field = check.field ?? '';
  const value = getTraceField(trace, field);

  // Special handling for the error_tracking check:
  // null means "no error" which is valid — only undefined is a failure.
  if (check.id === 'error_tracking') {
    return value !== undefined;
  }

  return isPresent(value);
}

/** "both_present" — every field in the `fields` array must be present. */
function evaluateBothPresent(
  check: CheckDefinition,
  trace: NormalizedTrace
): boolean {
  const fields = check.fields ?? [];
  return fields.every((field) => isPresent(getTraceField(trace, field)));
}

/** "non_empty_array" — the field must be a non-empty array. */
function evaluateNonEmptyArray(
  check: CheckDefinition,
  trace: NormalizedTrace
): boolean {
  const field = check.field ?? '';
  const value = getTraceField(trace, field);
  return Array.isArray(value) && value.length > 0;
}

// ── Run a Single Check ────────────────────────────────────────────────

/** Run one CheckDefinition against all traces and return an aggregated result. */
export function runCheck(
  check: CheckDefinition,
  traces: readonly NormalizedTrace[]
): CheckResult {
  const failedTraceIds: string[] = [];
  let passed = 0;
  let failed = 0;

  for (const trace of traces) {
    if (evaluateRule(check, trace)) {
      passed += 1;
    } else {
      failed += 1;
      failedTraceIds.push(trace.id);
    }
  }

  const total = traces.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 100;

  return { check, passed, failed, total, percentage, failedTraceIds };
}

// ── Scoring ───────────────────────────────────────────────────────────

/** Determine the overall verdict from trace-quality check results. */
function computeOverallVerdict(
  results: readonly CheckResult[]
): 'pass' | 'partial' | 'fail' {
  const criticalResults = results.filter(
    (r) => r.check.severity === 'critical'
  );

  // If any critical check is below 50%, overall is "fail".
  if (criticalResults.some((r) => r.percentage < 50)) {
    return 'fail';
  }

  // If all critical checks are at or above 95%, overall is "pass".
  if (criticalResults.every((r) => r.percentage >= 95)) {
    return 'pass';
  }

  return 'partial';
}

/** Build the score summary for the report. */
function buildScore(
  results: readonly CheckResult[],
  gaps: readonly ReadinessGap[]
): ReportScore {
  const passedChecks = results.filter((r) => r.percentage >= 100).length;

  return {
    traceQuality: {
      passed: passedChecks,
      total: results.length,
      percentage:
        results.length > 0
          ? Math.round((passedChecks / results.length) * 100)
          : 100,
    },
    readiness: {
      verified: gaps.filter((g) => g.verified).length,
      total: gaps.length,
    },
    overall: computeOverallVerdict(results),
  };
}

// ── Run the Full Engine ───────────────────────────────────────────────

/**
 * Run all checks from a loaded checklist against the provided traces.
 * Returns a complete GapReport ready for rendering.
 */
export function runEngine(
  traces: readonly NormalizedTrace[],
  checklist: ChecklistFile
): GapReport {
  // Run trace-quality checks.
  const traceQualityChecks = checklist.checks.filter(
    (c) => c.category === 'trace_quality'
  );
  const traceQuality = traceQualityChecks.map((check) =>
    runCheck(check, traces)
  );

  // Build readiness gaps (always unverified).
  const readinessGaps: ReadinessGap[] = checklist.readiness_gaps.map(
    (definition) => ({
      definition,
      verified: false,
    })
  );

  const score = buildScore(traceQuality, readinessGaps);

  // Infer the trace format from the first trace's metadata, defaulting
  // to 'langsmith' when there are no traces.
  const inferredFormat =
    traces.length > 0
      ? ((traces[0].metadata['source_format'] as string) ?? 'langsmith')
      : 'langsmith';

  const metadata = {
    regulation: checklist.regulation,
    article: checklist.article,
    date: new Date().toISOString(),
    traceCount: traces.length,
    format: inferredFormat as 'langsmith' | 'langfuse',
    toolVersion: '0.1.0',
  };

  return { metadata, traceQuality, readinessGaps, score };
}
