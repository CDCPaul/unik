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

const KEY = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

function savedRaw(mutate: (raw: Record<string, unknown>) => void): KeyValueStore & { data: Map<string, string> } {
  const s = memoryStore();
  const raw = JSON.parse(JSON.stringify(initialApplyState(KEY))) as Record<string, unknown>;
  mutate(raw);
  s.data.set('unik.applyDraft.v1', JSON.stringify(raw));
  return s;
}

describe('draft', () => {
  it('draft round-trips the idempotencyKey and answers, never the honeypot', () => {
    const s = memoryStore();
    let state = initialApplyState(KEY);
    state = applyReducer(state, { type: 'setLead', field: 'firstName', value: 'Maria' });
    state = applyReducer(state, { type: 'setHoneypot', value: 'bot' });
    saveDraft(s, state);
    const loaded = loadDraft(s)!;
    expect(loaded.idempotencyKey).toBe(KEY);
    expect(loaded.lead.firstName).toBe('Maria');
    expect(loaded.website).toBe('');
  });
  it('records submitAttempted in the saved draft', () => {
    const s = memoryStore();
    saveDraft(s, applyReducer(initialApplyState(KEY), { type: 'markSubmitAttempted' }));
    expect(loadDraft(s)!.submitAttempted).toBe(true);
  });
  it('accepts a draft saved before submitAttempted existed (missing means false)', () => {
    const s = savedRaw((raw) => void delete raw.submitAttempted);
    expect(loadDraft(s)!.submitAttempted).toBe(false);
  });
  it('treats a non-boolean submitAttempted as false', () => {
    expect(loadDraft(savedRaw((raw) => void (raw.submitAttempted = 'yes')))!.submitAttempted).toBe(false);
  });
  it('rejects a draft whose idempotencyKey is not a UUID', () => {
    const s = memoryStore();
    saveDraft(s, initialApplyState('key-7'));
    expect(loadDraft(s)).toBeNull();
  });
  it('rejects a draft with a traveler whose category is unknown', () => {
    const s = savedRaw((raw) => {
      raw.travelers = [{ category: 'x' }];
    });
    expect(loadDraft(s)).toBeNull();
  });
  it('rejects a draft with a non-object traveler', () => {
    const s = savedRaw((raw) => {
      raw.travelers = ['full'];
    });
    expect(loadDraft(s)).toBeNull();
  });
  it('rejects a draft with a non-string lead field', () => {
    const s = savedRaw((raw) => {
      (raw.lead as Record<string, unknown>).email = 42;
    });
    expect(loadDraft(s)).toBeNull();
  });
  it('rejects a draft with a non-string promoInput or specialRequests', () => {
    expect(loadDraft(savedRaw((raw) => void (raw.promoInput = null)))).toBeNull();
    expect(loadDraft(savedRaw((raw) => void (raw.specialRequests = 1)))).toBeNull();
  });
  it('rejects a draft with a non-boolean agreedToTerms', () => {
    expect(loadDraft(savedRaw((raw) => void (raw.agreedToTerms = 'yes')))).toBeNull();
  });
  it('rejects a departureId that is neither null nor a string', () => {
    expect(loadDraft(savedRaw((raw) => void (raw.departureId = 7)))).toBeNull();
  });
  it('accepts a null departureId', () => {
    expect(loadDraft(savedRaw(() => undefined))).not.toBeNull();
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
