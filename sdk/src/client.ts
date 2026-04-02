import {
  AgentLedgerConfig,
  CreateAgentInput,
  Agent,
  CreateSessionInput,
  Session,
  TrackEventInput,
  TrackedEvent,
} from './types';
import { AgentLedgerError, AuthenticationError, NetworkError } from './errors';

export class AgentLedger {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxBatchSize: number;
  private readonly debug: boolean;

  private queue: TrackEventInput[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: AgentLedgerConfig) {
    if (!config.apiKey) throw new Error('AgentLedger: apiKey is required');
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.agentledger.io/api/v1').replace(/\/$/, '');
    this.timeout = config.timeout ?? 5000;
    this.maxBatchSize = config.maxBatchSize ?? 50;
    this.debug = config.debug ?? false;

    const flushInterval = config.flushInterval ?? 5000;
    if (flushInterval > 0) {
      this.flushTimer = setInterval(() => this.flush().catch(() => {}), flushInterval);
      // Allow the process to exit without waiting for the timer
      if (typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
        this.flushTimer.unref();
      }
    }
  }

  // ── Agents ──────────────────────────────────────────────────────

  async createAgent(input: CreateAgentInput): Promise<Agent> {
    return this.request<Agent>('POST', '/agents', input);
  }

  // ── Sessions ────────────────────────────────────────────────────

  async createSession(input: CreateSessionInput): Promise<Session> {
    return this.request<Session>('POST', '/sessions', input);
  }

  // ── Events ──────────────────────────────────────────────────────

  /**
   * Queue an event for batched sending. Events are auto-flushed at
   * the configured `flushInterval` or when the batch reaches `maxBatchSize`.
   * Returns immediately — call `flush()` to send synchronously.
   */
  track(event: TrackEventInput): void {
    this.queue.push(event);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush().catch(() => {});
    }
  }

  /**
   * Send all queued events to the server immediately.
   * Resolves with the created events, or an empty array if the queue was empty.
   */
  async flush(): Promise<TrackedEvent[]> {
    if (this.queue.length === 0) return [];

    const batch = this.queue.splice(0);
    try {
      return await this.request<TrackedEvent[]>('POST', '/events', { events: batch });
    } catch (err) {
      // Put events back at the front so they aren't lost
      this.queue.unshift(...batch);
      throw err;
    }
  }

  /**
   * Stop the auto-flush timer and send remaining events.
   * Call this before your process exits.
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  // ── HTTP helper ─────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (res.status === 401) throw new AuthenticationError();
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new NetworkError(`HTTP ${res.status}: ${text}`);
        }

        return (await res.json()) as T;
      } finally {
        clearTimeout(timer);
      }
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof AuthenticationError) throw err;
        if (i === attempts - 1) throw err;
        if (this.debug) console.warn(`[AgentLedger] Retry ${i + 1}/${attempts - 1}`, err);
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
      }
    }
    throw new AgentLedgerError('Unreachable', 'INTERNAL');
  }
}
