import { createHash } from 'crypto';

export function sha256(data: unknown): string {
  const json = JSON.stringify(data, Object.keys(data as object).sort());
  return 'sha256:' + createHash('sha256').update(json).digest('hex');
}

export function chainHash(
  action: string,
  input: unknown,
  timestamp: string,
  prevHash: string | null
): string {
  return sha256({ action, input, timestamp, prevHash });
}
