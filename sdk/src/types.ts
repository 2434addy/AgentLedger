// ── Config ──────────────────────────────────────────────────────────
export interface AgentLedgerConfig {
  apiKey: string;
  baseUrl?: string;   // defaults to https://api.agentledger.io/api/v1
  timeout?: number;   // ms, default 5000
  flushInterval?: number; // ms, default 5000 — auto-flush batched events
  maxBatchSize?: number;  // default 50
  debug?: boolean;
}

// ── Enums (mirrors backend) ─────────────────────────────────────────
export type EventCategory =
  | 'agent_lifecycle'
  | 'llm_call'
  | 'tool_invocation'
  | 'user_action'
  | 'system'
  | 'security'
  | 'guardrail';

export type EventLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ── Agents ──────────────────────────────────────────────────────────
export interface CreateAgentInput {
  name: string;
  description?: string;
  modelProvider: string;
  modelId: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  modelProvider: string;
  modelId: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Sessions ────────────────────────────────────────────────────────
export interface CreateSessionInput {
  agentId: string;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  agentId: string;
  status: string;
  metadata: Record<string, unknown> | null;
  startedAt: string;
}

// ── Events ──────────────────────────────────────────────────────────
export interface TrackEventInput {
  agentId: string;
  sessionId?: string;
  category: EventCategory;
  level: EventLevel;
  message: string;
  metadata?: Record<string, unknown>;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  latencyMs?: number;
}

export interface TrackedEvent {
  id: string;
  agentId: string;
  sessionId: string | null;
  category: EventCategory;
  level: EventLevel;
  message: string;
  hash: string;
  prevHash: string | null;
  createdAt: string;
}
