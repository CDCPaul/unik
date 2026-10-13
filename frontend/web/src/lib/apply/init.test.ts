import { describe, expect, it } from 'vitest';
import { resolveInitialState } from './init';
import { applyReducer, initialApplyState } from './model';
import type { AppliedPromo, ApplyState } from './model';

const OLD_KEY = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const FRESH = '9b2c1f4e-1111-4222-8333-444455556666';
const base = initialApplyState(FRESH);
const promo = (code: string): AppliedPromo => ({ code, agencyName: 'A', discountType: 'fixed', discountValue: 1000, description: 'x' });
const withInput = (value: string): ApplyState => applyReducer(initialApplyState(OLD_KEY), { type: 'setPromoInput', value });
const withPromo = (code: string): ApplyState => applyReducer(initialApplyState(OLD_KEY), { type: 'promoApplied', promo: promo(code) });
const run = (o: Partial<Parameters<typeof resolveInitialState>[0]>) =>
  resolveInitialState({ draft: null, urlCode: null, storedCode: null, freshKey: FRESH, base, ...o });

describe('resolveInitialState: idempotency key', () => {
  it('uses the fresh key when there is no draft', () => {
    const r = resolveInitialState({ draft: null, urlCode: null, storedCode: null, freshKey: FRESH, base });
    expect(r.state.idempotencyKey).toBe(FRESH);
    expect(r.state.submitAttempted).toBe(false);
    expect(r.autoCheckCode).toBeNull();
  });
  it('gives a fresh key to a draft that never reached submit', () => {
    let draft = initialApplyState(OLD_KEY);
    draft = applyReducer(draft, { type: 'setLead', field: 'firstName', value: 'Maria' });
    const r = resolveInitialState({ draft, urlCode: null, storedCode: null, freshKey: FRESH, base });
    expect(r.state.idempotencyKey).toBe(FRESH);
    expect(r.state.submitAttempted).toBe(false);
    expect(r.state.lead.firstName).toBe('Maria');
  });
  it('keeps the draft key only when a submit was attempted (retry of the same application)', () => {
    const draft = applyReducer(initialApplyState(OLD_KEY), { type: 'markSubmitAttempted' });
    const r = resolveInitialState({ draft, urlCode: null, storedCode: null, freshKey: FRESH, base });
    expect(r.state.idempotencyKey).toBe(OLD_KEY);
    expect(r.state.submitAttempted).toBe(true);
  });
  it('treats a draft without the field as not attempted', () => {
    const draft = { ...initialApplyState(OLD_KEY) } as Record<string, unknown>;
    delete draft.submitAttempted;
    const r = resolveInitialState({ draft: draft as never, urlCode: null, storedCode: null, freshKey: FRESH, base });
    expect(r.state.idempotencyKey).toBe(FRESH);
    expect(r.state.submitAttempted).toBe(false);
  });
});

describe('resolveInitialState: promo codes', () => {
  it('auto-checks nothing when there is no code anywhere', () => {
    expect(run({}).autoCheckCode).toBeNull();
  });
  it('puts the URL code into an empty form and auto-checks the normalized code', () => {
    const r = run({ urlCode: ' ta-sunrise ' });
    expect(r.state.promoInput).toBe('TA-SUNRISE');
    expect(r.autoCheckCode).toBe('TA-SUNRISE');
  });
  it('ignores a URL code with an invalid format', () => {
    const r = run({ urlCode: 'no spaces allowed', storedCode: 'TA-STORED' });
    expect(r.state.promoInput).toBe('TA-STORED');
  });
  it('lets the URL code win over the stored code', () => {
    const r = run({ urlCode: 'TA-URL', storedCode: 'TA-STORED' });
    expect(r.state.promoInput).toBe('TA-URL');
    expect(r.autoCheckCode).toBe('TA-URL');
  });
  it('lets the URL code win over a code typed in the draft', () => {
    const r = run({ draft: withInput('TA-TYPED'), urlCode: 'TA-URL' });
    expect(r.state.promoInput).toBe('TA-URL');
    expect(r.autoCheckCode).toBe('TA-URL');
  });
  it('clears an applied draft promo when the URL code differs and checks the URL code instead', () => {
    const r = run({ draft: withPromo('TA-OLD'), urlCode: 'ta-new' });
    expect(r.state.promo).toBeNull();
    expect(r.state.promoInput).toBe('TA-NEW');
    expect(r.autoCheckCode).toBe('TA-NEW');
  });
  it('keeps the applied draft promo (no re-check) when the URL code is the same', () => {
    const r = run({ draft: withPromo('TA-SAME'), urlCode: 'ta-same' });
    expect(r.state.promo?.code).toBe('TA-SAME');
    expect(r.state.promoInput).toBe('TA-SAME');
    expect(r.autoCheckCode).toBeNull();
  });
  it('keeps an applied draft promo over the stored code', () => {
    const r = run({ draft: withPromo('TA-APPLIED'), storedCode: 'TA-STORED' });
    expect(r.state.promo?.code).toBe('TA-APPLIED');
    expect(r.state.promoInput).toBe('TA-APPLIED');
    expect(r.autoCheckCode).toBeNull();
  });
  it('fills an empty draft input with the stored code and checks it', () => {
    const r = run({ draft: initialApplyState(OLD_KEY), storedCode: 'TA-STORED' });
    expect(r.state.promoInput).toBe('TA-STORED');
    expect(r.autoCheckCode).toBe('TA-STORED');
  });
  it('keeps a typed draft input over the stored code when there is no URL code', () => {
    const r = run({ draft: withInput('ta-typed'), storedCode: 'TA-STORED' });
    expect(r.state.promoInput).toBe('ta-typed');
    expect(r.autoCheckCode).toBe('TA-TYPED');
  });
  it('does not mutate the draft it was given', () => {
    const draft = withPromo('TA-OLD');
    run({ draft, urlCode: 'TA-NEW' });
    expect(draft.promo?.code).toBe('TA-OLD');
  });
});
