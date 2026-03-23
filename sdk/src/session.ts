import { randomUUID } from 'crypto';
import { EventEmitter } from './emitter';
import { chainHash } from './hasher';
import { AgentLedgerConfig, RunOptions, AgentLedgerResponse } from './types';

export class Session {
  public readonly sessionId: string;
  private prevHash: string | null = null;
  private eventCount = 0;

  constructor(
    private readonly agentId: string,
    private readonly emitter: EventEmitter,
    private readonly config: AgentLedgerConfig,
    sessionId?: string
  ) {
    this.sessionId = sessionId || randomUUID();
  }

  async run<TInput, TOutput>(
    fn: (input: TInput) => Promise<TOutput>,
    input: TInput,
    options: RunOptions = {}
  ): Promise<TOutput> {
    const timestamp = new Date().toISOString();
    const action = options.action || fn.name || 'agent_action';
    const riskLevel = options.riskLevel || this.config.riskThreshold || 'low';
    const hash = chainHash(action, input, timestamp, this.prevHash);

    // Emit the START event
    let ledgerResponse: AgentLedgerResponse;
    try {
      ledgerResponse = await this.emitter.emitEvent({
        agent_id: this.agentId,
        session_id: this.sessionId,
        action,
        input: input as Record<string, unknown>,
        hash,
        prev_hash: this.prevHash,
        timestamp,
        risk_level: riskLevel,
        status: 'pending',
        approval_status: options.requireApproval ? 'pending_review' : 'auto_approved',
        metadata: options.metadata,
      });
    } catch (err) {
      // Never crash the agent — log and continue
      if (this.config.debug) console.warn('[AgentLedger] Failed to emit event:', err);
      return fn(input);
    }

    // If approval required — poll until approved or rejected
    if (options.requireApproval || ledgerResponse.approval_status === 'pending_review') {
      await this.emitter.pollApproval(
        ledgerResponse.event_id,
        2000,
        options.timeoutMs || 300000
      );
    }

    // Execute the actual agent function
    let output: TOutput;
    let error: Error | undefined;

    try {
      output = await fn(input);
    } catch (err) {
      error = err as Error;
      // Emit failure event
      try {
        await this.emitter.emitEvent({
          event_id: ledgerResponse.event_id,
          agent_id: this.agentId,
          session_id: this.sessionId,
          action,
          input: input as Record<string, unknown>,
          hash,
          prev_hash: this.prevHash,
          timestamp: new Date().toISOString(),
          risk_level: riskLevel,
          status: 'failed',
          approval_status: 'auto_approved',
          metadata: { error: error.message },
        });
      } catch {
        // Silent fail — never crash the agent
      }
      throw error;
    }

    // Emit completion event with output
    try {
      await this.emitter.emitEvent({
        event_id: ledgerResponse.event_id,
        agent_id: this.agentId,
        session_id: this.sessionId,
        action,
        input: input as Record<string, unknown>,
        output: output as Record<string, unknown>,
        hash,
        prev_hash: this.prevHash,
        timestamp: new Date().toISOString(),
        risk_level: riskLevel,
        status: 'completed',
        approval_status: ledgerResponse.approval_status,
      });
    } catch {
      // Silent fail — never crash the agent
    }

    // Update chain
    this.prevHash = hash;
    this.eventCount++;

    return output;
  }
}
