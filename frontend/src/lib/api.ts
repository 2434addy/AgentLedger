import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ─── In-memory token storage — never persisted to localStorage ───────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    organisationId: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  modelProvider: string;
  modelId: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  agentId: string;
  agent?: Agent;
  status: 'active' | 'completed' | 'failed' | 'timeout';
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown> | null;
  totalEvents?: number;
  totalCost?: string | number;
}

export interface Event {
  id: string;
  sessionId: string;
  agentId: string;
  category: 'llm_call' | 'tool_invocation' | 'user_action' | 'agent_lifecycle' | 'system' | 'security' | 'guardrail';
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  payload: Record<string, unknown> | null;
  stateBefore: Record<string, unknown> | null;
  stateAfter: Record<string, unknown> | null;
  latencyMs: number | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
  timestamp: string;
  hash: string | null;
  prevHash: string | null;
  seqNumber: number | null;
}

// Backend returns raw SQL aggregation arrays — all numeric fields are strings
export type UsageAnalyticsRaw = { category: string; count: string }[];
export type CostAnalyticsRaw = { agentId: string; totalCost: string; eventCount: string }[];
export type ModelAnalyticsRaw = { modelProvider: string; modelId: string; totalTokensInput: string; totalTokensOutput: string; totalCost: string; eventCount: string }[];

// Keep structured types for frontend-processed data
export interface CostAnalytics {
  totalCostUsd: number;
  byDate: { date: string; costUsd: number }[];
  byModel: { modelId: string; costUsd: number }[];
  byAgent: { agentId: string; agentName: string; costUsd: number }[];
}

export interface UsageAnalytics {
  totalEvents: number;
  totalTokens: number;
  byDate: { date: string; events: number; tokens: number }[];
  byCategory: { category: string; count: number }[];
}

// Backend returns { latencySpikes: Event[], errorBursts: [...], agentLoops: [...] }
export interface AnomalyResponse {
  latencySpikes: Event[];
  errorBursts: { minute: string; error_count: string }[];
  agentLoops: { sessionId: string; agentId: string; message: string; repeat_count: string }[];
}

// Normalized anomaly for UI display
export interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  agentId: string | null;
  sessionId: string | null;
  detectedAt: string;
}

export interface ComplianceReport {
  guardrailEvents: number;
  securityEvents: number;
  totalAuditLogs: number;
  generatedAt: string;
}

export interface ComplianceCheck {
  name: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface ComplianceReportGeneratedSection {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  score: number;
  evidence: string;
  recommendation: string;
  eventCount: number;
}

export interface ComplianceReportGenerated {
  framework: string;
  frameworkName: string;
  orgId: string;
  generatedAt: string;
  overallScore: number;
  overallStatus: 'pass' | 'warn' | 'fail';
  sections: ComplianceReportGeneratedSection[];
  summary: {
    totalEventsAnalyzed: number;
    totalAuditLogsAnalyzed: number;
    sectionsPass: number;
    sectionsWarn: number;
    sectionsFail: number;
  };
}

export interface Approval {
  id: string;
  orgId: string;
  agentId: string;
  sessionId: string | null;
  type: 'tool_execution' | 'data_access' | 'cost_threshold' | 'custom';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  payload: Record<string, unknown>;
  requestedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  expiresAt: string;
  createdAt: string;
  agent?: Agent;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor — attach Bearer token and CSRF header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  // Send CSRF token from cookie for state-changing requests only
  const method = config.method?.toLowerCase() ?? '';
  if (['post', 'patch', 'put', 'delete'].includes(method) && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )csrf-token=([^;]*)/);
    if (match) {
      config.headers['X-CSRF-Token'] = decodeURIComponent(match[1]);
    }
  }
  return config;
});

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshUrl = originalRequest?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        _accessToken = newToken;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        _accessToken = null;
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (data: { email: string; password: string; displayName: string }) =>
    api.post<AuthResponse>('/api/v1/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/v1/auth/login', data),
  refresh: () =>
    api.post<{ accessToken: string; user: AuthResponse['user'] }>('/api/v1/auth/refresh'),
  logout: () =>
    api.post('/api/v1/auth/logout'),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/api/v1/auth/reset-password', { token, newPassword }),
};

// ─── Organisations ────────────────────────────────────────────────────────────

export const orgApi = {
  getMe: () => api.get<Organisation>('/api/v1/organisations/me'),
  updateMe: (data: Partial<Organisation>) => api.patch<Organisation>('/api/v1/organisations/me', data),
};

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const apiKeysApi = {
  list: () => api.get<ApiKey[]>('/api/v1/api-keys'),
  create: (name: string) => api.post<ApiKeyCreated>('/api/v1/api-keys', { name }),
  delete: (id: string) => api.delete(`/api/v1/api-keys/${id}`),
};

// ─── Agents ───────────────────────────────────────────────────────────────────

export const agentsApi = {
  list: () => api.get<Agent[]>('/api/v1/agents'),
  get: (id: string) => api.get<Agent>(`/api/v1/agents/${id}`),
  create: (data: { name: string; modelProvider: string; modelId: string; description?: string }) =>
    api.post<Agent>('/api/v1/agents', data),
  update: (id: string, data: Partial<Agent>) => api.patch<Agent>(`/api/v1/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/agents/${id}`),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list: (params?: { agentId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<Session[]>('/api/v1/sessions', { params }),
  get: (id: string) => api.get<Session>(`/api/v1/sessions/${id}`),
  create: (data: { agentId: string; metadata?: Record<string, unknown> }) =>
    api.post<Session>('/api/v1/sessions', data),
  update: (id: string, data: Partial<Session>) => api.patch<Session>(`/api/v1/sessions/${id}`, data),
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: {
    sessionId?: string;
    agentId?: string;
    category?: string;
    level?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get<Event[]>('/api/v1/events', { params }),
  get: (id: string) => api.get<Event>(`/api/v1/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/api/v1/events', data),
  verify: () =>
    api.get<{ total: number; valid: number; tampered: number; tamperedIds: string[] }>('/api/v1/events/verify'),
  verifyChain: () =>
    api.get<{ total: number; valid: number; broken: number; chainIntact: boolean; brokenLinks: { eventId: string; seqNumber: number; reason: string }[] }>('/api/v1/events/verify-chain'),
  verifyOne: (id: string) =>
    api.get<{ id: string; valid: boolean; storedHash: string; recomputedHash: string }>(`/api/v1/events/${id}/verify`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  cost: (params?: { from?: string; to?: string }) =>
    api.get<CostAnalyticsRaw>('/api/v1/analytics/cost', { params }),
  usage: (params?: { from?: string; to?: string }) =>
    api.get<UsageAnalyticsRaw>('/api/v1/analytics/usage', { params }),
  models: (params?: { from?: string; to?: string }) =>
    api.get<ModelAnalyticsRaw>('/api/v1/analytics/models', { params }),
};

// ─── Anomalies ────────────────────────────────────────────────────────────────

export const anomaliesApi = {
  list: () => api.get<AnomalyResponse>('/api/v1/anomalies'),
};

// ─── Compliance ───────────────────────────────────────────────────────────────

export type ComplianceFramework = 'eu-ai-act' | 'soc2' | 'iso42001';

export const complianceApi = {
  report: () => api.get<ComplianceReport>('/api/v1/compliance/report'),
  checks: () => api.get<ComplianceCheck[]>('/api/v1/compliance/checks'),
  generate: (framework: ComplianceFramework) =>
    api.post<ComplianceReportGenerated>('/api/v1/compliance/reports/generate', { framework }),
};

// ─── Approvals ───────────────────────────────────────────────────────────────

export const approvalsApi = {
  list: (params?: { status?: string }) =>
    api.get<Approval[]>('/api/v1/approvals', { params }),
  listPending: () =>
    api.get<Approval[]>('/api/v1/approvals/pending'),
  get: (id: string) => api.get<Approval>(`/api/v1/approvals/${id}`),
  approve: (id: string, comment?: string) =>
    api.patch<Approval>(`/api/v1/approvals/${id}/approve`, { comment }),
  reject: (id: string, comment?: string) =>
    api.patch<Approval>(`/api/v1/approvals/${id}/reject`, { comment }),
};

export default api;
