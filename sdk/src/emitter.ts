import { AgentLedgerConfig, AgentEvent, AgentLedgerResponse, ApprovalStatus } from './types';
import { AgentLedgerError, AuthenticationError, NetworkError, ApprovalRejectedError } from './errors';

export class EventEmitter {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: AgentLedgerConfig) {
    this.baseUrl = (config.baseUrl || 'https://api.agentledger.io').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 5000;
  }

  async emitEvent(event: Partial<AgentEvent>): Promise<AgentLedgerResponse> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(`${this.baseUrl}/v1/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(event),
          signal: controller.signal,
        });

        if (res.status === 401) throw new AuthenticationError();
        if (!res.ok) throw new NetworkError(`HTTP ${res.status}`);

        return await res.json() as AgentLedgerResponse;
      } finally {
        clearTimeout(timer);
      }
    });
  }

  async checkApproval(eventId: string): Promise<ApprovalStatus> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/v1/events/${eventId}/approval`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });
      if (res.status === 401) throw new AuthenticationError();
      if (!res.ok) throw new NetworkError(`HTTP ${res.status}`);
      const data = await res.json() as { approval_status: ApprovalStatus };
      return data.approval_status;
    } finally {
      clearTimeout(timer);
    }
  }

  async pollApproval(
    eventId: string,
    intervalMs = 2000,
    timeoutMs = 300000
  ): Promise<ApprovalStatus> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const status = await this.checkApproval(eventId);
      if (status === 'approved') return status;
      if (status === 'rejected') throw new ApprovalRejectedError(eventId);
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new AgentLedgerError('Approval timeout exceeded', 'APPROVAL_TIMEOUT');
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof AuthenticationError) throw err;
        if (i === attempts - 1) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 500));
      }
    }
    throw new Error('Unreachable');
  }
}
