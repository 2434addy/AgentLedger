import { EventEmitter } from './emitter';
import { Session } from './session';
import { AgentLedgerConfig, WrapOptions, RunOptions, SessionOptions } from './types';

export class AgentLedger {
  private emitter: EventEmitter;

  constructor(private config: AgentLedgerConfig) {
    if (!config.apiKey) throw new Error('AgentLedger: apiKey is required');
    this.emitter = new EventEmitter(config);
  }

  /** Wrap an agent function — returns a tracked version */
  wrap<TInput, TOutput>(
    agentId: string,
    fn: (input: TInput) => Promise<TOutput>,
    options: WrapOptions = {}
  ) {
    const session = new Session(agentId, this.emitter, this.config);

    return {
      /** Run with full audit trail */
      run: (input: TInput, runOptions: RunOptions = {}) =>
        session.run(fn, input, {
          ...runOptions,
          riskLevel: runOptions.riskLevel || options.defaultRiskLevel,
          requireApproval: runOptions.requireApproval ?? options.requireApproval,
        }),

      /** Get session ID */
      sessionId: session.sessionId,
    };
  }

  /** Create a named session for multi-step workflows */
  session(agentId: string, options: SessionOptions = {}) {
    return new Session(agentId, this.emitter, this.config, options.sessionId);
  }

  /** Quick one-shot event (fire and forget) */
  async track(agentId: string, action: string, data: Record<string, unknown>) {
    const session = new Session(agentId, this.emitter, this.config);
    return session.run(async () => data, data, { action });
  }
}
