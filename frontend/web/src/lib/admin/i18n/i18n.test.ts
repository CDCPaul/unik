import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from './en';
import type { MessageKey } from './en';
import { ko } from './ko';
import { LOCALE_STORAGE_KEY, readStoredLocale, writeStoredLocale } from './storage';
import { MessageError, makeT, msg, placeholders, translate } from './translate';

describe('dictionaries', () => {
  it('ko has exactly the same keys as en', () => {
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
  });
  it('has no empty values', () => {
    for (const [k, v] of Object.entries(ko)) expect(v.trim(), k).not.toBe('');
    for (const [k, v] of Object.entries(en)) expect(v.trim(), k).not.toBe('');
  });
  it('uses the same placeholders in en and ko for every key', () => {
    for (const k of Object.keys(en) as MessageKey[]) {
      expect(placeholders(ko[k]), k).toEqual(placeholders(en[k]));
    }
  });
});

describe('translate', () => {
  it('interpolates {name} params and leaves missing ones as is', () => {
    expect(translate('en', 'traveler.title', { n: 3 })).toBe('Traveler 3');
    expect(translate('ko', 'traveler.title', { n: 3 })).toBe('참가자 3');
    expect(translate('en', 'login.domainNote')).toBe('Only {domain} accounts are allowed');
  });
  it('translates nested messages and joins message lists in the same locale', () => {
    const m = msg('edits.noPrice', { categories: [msg('category.child'), msg('category.infant')] });
    expect(translate('en', m)).toBe('This departure has no price for Child (under 12), Infant (under 2). Set it in Tour settings first.');
    expect(translate('ko', m)).toBe('이 출발편에는 아동(12세 미만), 유아(24개월 미만) 가격이 없습니다. 먼저 상품 설정에서 입력하세요.');
  });
  it('does not re-interpolate substituted values', () => {
    expect(translate('en', 'promo.created', { code: '{code}' })).toBe('Created {code}.');
  });
  it('makeT accepts a key with params or a Msg', () => {
    const t = makeT('ko');
    expect(t('status.deposit_paid')).toBe('예약금 입금');
    expect(t(msg('counts.item', { n: 2, category: msg('category.full') }))).toBe('풀코스 2명');
  });
  it('MessageError carries the Msg and an English message', () => {
    const e = new MessageError(msg('edits.configNotLoaded'));
    expect(e.message).toBe('Tour settings are not loaded yet.');
    expect(e.msg.key).toBe('edits.configNotLoaded');
  });
});

describe('locale storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('falls back to en when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readStoredLocale()).toBe('en');
    expect(() => writeStoredLocale('ko')).not.toThrow();
  });
  it('falls back to en when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readStoredLocale()).toBe('en');
    expect(() => writeStoredLocale('ko')).not.toThrow();
  });
  it('round-trips a valid locale and ignores junk', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    expect(readStoredLocale()).toBe('en');
    writeStoredLocale('ko');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('ko');
    expect(readStoredLocale()).toBe('ko');
    store.set(LOCALE_STORAGE_KEY, 'fr');
    expect(readStoredLocale()).toBe('en');
  });
});
