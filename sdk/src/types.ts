export interface AgentLedgerConfig {
  apiKey: string;
  baseUrl?: string;          // defaults to https://api.agentledger.io
  timeout?: number;          // ms, default 5000
  riskThreshold?: RiskLevel; // auto-flag above this level
  debug?: boolean;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
export type ApprovalStatus = 'auto_approved' | 'pending_review' | 'approved' | 'rejected';

export interface AgentEvent {
  event_id: string;
  agent_id: string;
  session_id: string;
  action: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  hash: string;
  prev_hash: string | null;
  timestamp: string;
  risk_level: RiskLevel;
  status: EventStatus;
  approval_status: ApprovalStatus;
  metadata?: Record<string, unknown>;
}

export interface RunOptions {
  action?: string;
  riskLevel?: RiskLevel;
  requireApproval?: boolean;
  metadata?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface SessionOptions {
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface WrapOptions {
  defaultRiskLevel?: RiskLevel;
  requireApproval?: boolean;
}

export interface AgentLedgerResponse {
  event_id: string;
  hash: string;
  prev_hash: string | null;
  approval_status: ApprovalStatus;
  session_id: string;
  timestamp: string;
}
