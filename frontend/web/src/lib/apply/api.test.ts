import { describe, expect, it, vi } from 'vitest';
import { checkPromo, submitWithRetry } from './api';
import type { SubmitPayload, SubmitResponse } from './api';

const payload = { idempotencyKey: 'k' } as unknown as SubmitPayload;
const ok: SubmitResponse = { appNo: 'APP-0001', status: 'new', pricing: {} as never, duplicate: false };
const transient = () => Object.assign(new Error('x'), { code: 'functions/unavailable' });
const fatal = () => Object.assign(new Error('x'), { code: 'functions/failed-precondition', details: { code: 'closed' } });

describe('submitWithRetry', () => {
  it('retries retryable errors with the same payload', async () => {
    const call = vi.fn().mockRejectedValueOnce(transient()).mockRejectedValueOnce(transient()).mockResolvedValue(ok);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(submitWithRetry(payload, { call, sleep })).resolves.toEqual(ok);
    expect(call).toHaveBeenCalledTimes(3);
    for (const args of call.mock.calls) expect(args[0]).toBe(payload);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
  it('gives up after the attempt limit', async () => {
    const call = vi.fn().mockRejectedValue(transient());
    await expect(submitWithRetry(payload, { call, sleep: async () => {}, attempts: 3 })).rejects.toMatchObject({ code: 'functions/unavailable' });
    expect(call).toHaveBeenCalledTimes(3);
  });
  it('does not retry business errors', async () => {
    const call = vi.fn().mockRejectedValue(fatal());
    await expect(submitWithRetry(payload, { call, sleep: async () => {} })).rejects.toMatchObject({ details: { code: 'closed' } });
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe('checkPromo', () => {
  it('sends the normalized code and pax', async () => {
    const call = vi.fn().mockResolvedValue({ valid: false, reason: 'not_found' });
    await checkPromo(' ta-x ', 3, { call });
    expect(call).toHaveBeenCalledWith({ code: 'TA-X', pax: 3 });
  });
});
