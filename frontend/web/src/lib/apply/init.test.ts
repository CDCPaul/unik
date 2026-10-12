import { describe, expect, it } from 'vitest';
import { resolveInitialState } from './init';
import { applyReducer, initialApplyState } from './model';

const OLD_KEY = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const FRESH = '9b2c1f4e-1111-4222-8333-444455556666';
const base = initialApplyState(FRESH);

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
