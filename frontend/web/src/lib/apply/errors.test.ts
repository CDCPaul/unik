import { describe, expect, it } from 'vitest';
import { describeSubmitError, isRetryable } from './errors';

const fnError = (code: string, details?: unknown, message = 'x') => Object.assign(new Error(message), { code, details });

describe('isRetryable', () => {
  it('retries transient function errors only', () => {
    for (const c of ['functions/internal', 'functions/unavailable', 'functions/deadline-exceeded', 'functions/aborted']) {
      expect(isRetryable(fnError(c))).toBe(true);
    }
    expect(isRetryable(fnError('functions/failed-precondition'))).toBe(false);
    expect(isRetryable(new Error('plain'))).toBe(false);
  });
});

describe('describeSubmitError', () => {
  it('maps invalid input with field issues', () => {
    const d = describeSubmitError(
      fnError('functions/invalid-argument', { code: 'invalid_input', issues: [{ path: 'lead.email', message: 'Invalid email' }] }, 'Please check the form and try again.'),
    );
    expect(d.kind).toBe('invalid_input');
    expect(d.issues).toEqual([{ path: 'lead.email', message: 'Invalid email' }]);
  });
  it('maps promo errors with a reason message', () => {
    const d = describeSubmitError(fnError('functions/failed-precondition', { code: 'promo_invalid', reason: 'expired' }));
    expect(d).toMatchObject({ kind: 'promo_invalid', promoReason: 'expired' });
    expect(d.message).toMatch(/expired/i);
  });
  it('maps closed, departure_closed and rate_limited', () => {
    expect(describeSubmitError(fnError('functions/failed-precondition', { code: 'closed' })).kind).toBe('closed');
    expect(describeSubmitError(fnError('functions/failed-precondition', { code: 'departure_closed' })).kind).toBe('departure_closed');
    expect(describeSubmitError(fnError('functions/resource-exhausted', { code: 'rate_limited' }, 'We received several')).kind).toBe('rate_limited');
  });
  it('treats exhausted retries as a network problem', () => {
    expect(describeSubmitError(fnError('functions/unavailable')).kind).toBe('network');
  });
  it('falls back to unknown', () => {
    expect(describeSubmitError('boom').kind).toBe('unknown');
  });
});
