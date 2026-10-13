import { describe, expect, it } from 'vitest';
import { PROMO_TTL_MS, clearPromoCode, loadPromoCode, savePromoCode } from './storage';
import type { KeyValueStore } from '../store';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
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

describe('promo storage', () => {
  const t0 = 1_800_000_000_000;
  it('normalizes and saves a valid code, then loads it', () => {
    const s = memoryStore();
    expect(savePromoCode(s, ' ta-sunrise ', t0)).toBe('TA-SUNRISE');
    expect(loadPromoCode(s, t0 + 1000)).toBe('TA-SUNRISE');
  });
  it('rejects malformed codes without storing', () => {
    const s = memoryStore();
    expect(savePromoCode(s, 'a b', t0)).toBeNull();
    expect(s.data.size).toBe(0);
  });
  it('keeps branch codes with an underscore from referral links', () => {
    const s = memoryStore();
    expect(savePromoCode(s, 'grh_c', t0)).toBe('GRH_C');
  });
  it('expires after 30 days and removes the entry', () => {
    const s = memoryStore();
    savePromoCode(s, 'TA-X1', t0);
    expect(loadPromoCode(s, t0 + PROMO_TTL_MS + 1)).toBeNull();
    expect(s.data.size).toBe(0);
  });
  it('survives a throwing or missing store', () => {
    expect(savePromoCode(throwingStore, 'TA-X1', t0)).toBe('TA-X1');
    expect(loadPromoCode(throwingStore, t0)).toBeNull();
    expect(loadPromoCode(null, t0)).toBeNull();
    expect(() => clearPromoCode(throwingStore)).not.toThrow();
  });
  it('ignores corrupted entries', () => {
    const s = memoryStore();
    s.data.set('unik.promoCode', '{not json');
    expect(loadPromoCode(s, t0)).toBeNull();
  });
});
