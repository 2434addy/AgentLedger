export class AgentLedgerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AgentLedgerError';
  }
}

export class AuthenticationError extends AgentLedgerError {
  constructor() {
    super('Invalid API key. Check your apiKey in config.', 'AUTH_ERROR');
  }
}

export class NetworkError extends AgentLedgerError {
  constructor(message: string) {
    super(`Network error: ${message}`, 'NETWORK_ERROR');
  }
}
