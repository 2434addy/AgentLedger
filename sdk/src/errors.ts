export class AgentLedgerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AgentLedgerError';
  }
}

export class ApprovalRequiredError extends AgentLedgerError {
  constructor(public eventId: string, public agentId: string) {
    super(
      `Action requires human approval. Event ID: ${eventId}`,
      'APPROVAL_REQUIRED'
    );
  }
}

export class ApprovalRejectedError extends AgentLedgerError {
  constructor(public eventId: string) {
    super(`Action was rejected by human reviewer. Event ID: ${eventId}`, 'APPROVAL_REJECTED');
  }
}

export class AuthenticationError extends AgentLedgerError {
  constructor() {
    super('Invalid AgentLedger API key. Check your apiKey in config.', 'AUTH_ERROR');
  }
}

export class NetworkError extends AgentLedgerError {
  constructor(message: string) {
    super(`Network error: ${message}`, 'NETWORK_ERROR');
  }
}
