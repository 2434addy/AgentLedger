import type { GapReport } from '../types';

export function renderJson(report: GapReport): string {
  return JSON.stringify(report, null, 2);
}
