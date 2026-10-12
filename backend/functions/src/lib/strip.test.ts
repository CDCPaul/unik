import { describe, expect, it } from 'vitest';
import { stripUndefined } from './strip';

describe('stripUndefined', () => {
  it('removes undefined keys deeply and keeps null', () => {
    expect(
      stripUndefined({ a: 1, b: undefined, c: null, d: [{ e: undefined, f: 'x' }], g: { h: undefined } }),
    ).toEqual({ a: 1, c: null, d: [{ f: 'x' }], g: {} });
  });
});
