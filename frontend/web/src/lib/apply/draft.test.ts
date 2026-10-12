import { describe, expect, it } from 'vitest';
import { clearDraft, loadDraft, saveDraft } from './draft';
import { applyReducer, initialApplyState } from './model';
import type { KeyValueStore } from '../store';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('draft', () => {
  it('draft round-trips the idempotencyKey and answers, never the honeypot', () => {
    const s = memoryStore();
    let state = initialApplyState('key-7');
    state = applyReducer(state, { type: 'setLead', field: 'firstName', value: 'Maria' });
    state = applyReducer(state, { type: 'setHoneypot', value: 'bot' });
    saveDraft(s, state);
    const loaded = loadDraft(s)!;
    expect(loaded.idempotencyKey).toBe('key-7');
    expect(loaded.lead.firstName).toBe('Maria');
    expect(loaded.website).toBe('');
  });
  it('ignores corrupted or foreign data', () => {
    const s = memoryStore();
    s.data.set('unik.applyDraft.v1', '{"counts":"x"}');
    expect(loadDraft(s)).toBeNull();
  });
  it('works with a throwing store', () => {
    expect(() => saveDraft(throwingStore, initialApplyState('k'))).not.toThrow();
    expect(loadDraft(throwingStore)).toBeNull();
    expect(() => clearDraft(throwingStore)).not.toThrow();
  });
});
