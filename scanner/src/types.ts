// ── Trace Formats ──────────────────────────────────────────────────
export type TraceFormat = 'langsmith' | 'langfuse';

// ── Normalized Trace ───────────────────────────────────────────────
// The central type: both parsers produce this, the engine consumes it.
export interface NormalizedTrace {
  id: string;
  traceId: string;
  timestamp: string | null;       // ISO 8601
  endTimestamp: string | null;
  agentId: string | null;         // name of the agent/chain/model
  agentType: string | null;       // run_type (LS) or observation type (LF)
  input: unknown | null;
  output: unknown | null;
  error: string | null;
  toolCalls: ToolCall[];
  tokens: TokenUsage;
  cost: CostUsage;
  metadata: Record<string, unknown>;
  parentId: string | null;
}

export interface ToolCall {
  name: string;
  input: unknown | null;
  output: unknown | null;
  error: string | null;
  timestamp: string | null;
}

export interface TokenUsage {
  input?: number;
  output?: number;
  total?: number;
}

export interface CostUsage {
  input?: number;
  output?: number;
  total?: number;
}

// ── YAML Checklist Rule ────────────────────────────────────────────
export interface CheckDefinition {
  id: string;
  field?: string;
  fields?: string[];
  rule: CheckRule;
  severity: Severity;
  article: string;
  description: string;
  category: CheckCategory;
}

export type CheckRule =
  | 'required'       // field must be non-null and non-empty
  | 'both_present'   // all listed fields must be present
  | 'format'         // field matches a pattern (future)
  | 'non_empty_array'; // field must be a non-empty array

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type CheckCategory = 'trace_quality' | 'readiness_gap';

// ── Checklist File Schema ──────────────────────────────────────────
export interface ChecklistFile {
  name: string;
  version: string;
  regulation: string;
  article: string;
  description: string;
  disclaimer: string;
  checks: CheckDefinition[];
  readiness_gaps: ReadinessGapDefinition[];
}

export interface ReadinessGapDefinition {
  id: string;
  article: string;
  description: string;
  recommendation: string;
  severity: Severity;
}

// ── Engine Results ─────────────────────────────────────────────────
export interface CheckResult {
  check: CheckDefinition;
  passed: number;
  failed: number;
  total: number;
  percentage: number;
  failedTraceIds: string[];
}

export interface ReadinessGap {
  definition: ReadinessGapDefinition;
  verified: boolean; // always false — cannot verify from trace data
}

export interface GapReport {
  metadata: ReportMetadata;
  traceQuality: CheckResult[];
  readinessGaps: ReadinessGap[];
  score: ReportScore;
}

export interface ReportMetadata {
  regulation: string;
  article: string;
  date: string;
  traceCount: number;
  format: TraceFormat;
  domain?: string;
  toolVersion: string;
}

export interface ReportScore {
  traceQuality: { passed: number; total: number; percentage: number };
  readiness: { verified: number; total: number };
  overall: 'pass' | 'partial' | 'fail';
}

// ── CLI Options ────────────────────────────────────────────────────
export interface ScanOptions {
  file: string;
  regulation: string;
  format?: TraceFormat;
  output: OutputFormat;
  outDir: string;
  domain?: string;
}

export type OutputFormat = 'terminal' | 'pdf' | 'json' | 'all';
