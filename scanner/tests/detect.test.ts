import { describe, it, expect } from 'vitest';
import { detectFormat } from '../src/detect';
import langsmithComplete from './fixtures/langsmith-complete.json';
import langsmithPartial from './fixtures/langsmith-partial.json';
import langfuseComplete from './fixtures/langfuse-complete.json';
import langfusePartial from './fixtures/langfuse-partial.json';
import invalidData from './fixtures/invalid.json';
import emptyData from './fixtures/empty.json';

describe('detectFormat', () => {
  it('detects LangSmith format from complete traces', () => {
    const result = detectFormat(langsmithComplete);
    expect(result.format).toBe('langsmith');
    expect(result.data).toHaveLength(3);
  });

  it('detects LangSmith format from partial traces', () => {
    const result = detectFormat(langsmithPartial);
    expect(result.format).toBe('langsmith');
    expect(result.data).toHaveLength(2);
  });

  it('detects LangFuse format from complete traces', () => {
    const result = detectFormat(langfuseComplete);
    expect(result.format).toBe('langfuse');
    expect(result.data).toHaveLength(1);
  });

  it('detects LangFuse format from partial traces', () => {
    const result = detectFormat(langfusePartial);
    expect(result.format).toBe('langfuse');
  });

  it('handles data wrapped in { data: [...] }', () => {
    const wrapped = { data: langsmithComplete };
    const result = detectFormat(wrapped);
    expect(result.format).toBe('langsmith');
    expect(result.data).toHaveLength(3);
  });

  it('throws on empty array', () => {
    expect(() => detectFormat(emptyData)).toThrow('Empty trace data');
  });

  it('throws on invalid/unrecognized format', () => {
    expect(() => detectFormat([invalidData])).toThrow('Unrecognized trace format');
  });

  it('throws on non-array non-object input', () => {
    expect(() => detectFormat('hello')).toThrow('Unrecognized input shape');
  });

  it('throws on array of non-objects', () => {
    expect(() => detectFormat([1, 2, 3])).toThrow('expected array elements to be objects');
  });
});
