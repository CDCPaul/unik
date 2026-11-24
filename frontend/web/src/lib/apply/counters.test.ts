import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '@unik/shared/domain';
import type { Counts } from '@unik/shared/domain';
import { MINOR_CATEGORIES, showMinorCounters } from './counters';

const zero = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Counts;

describe('showMinorCounters', () => {
  it('stays closed for adults only until the user opens it', () => {
    expect(showMinorCounters({ ...zero, full: 1, tenK: 2 }, false)).toBe(false);
    expect(showMinorCounters({ ...zero, full: 1 }, true)).toBe(true);
  });
  it.each(MINOR_CATEGORIES)('opens automatically when %s > 0 (e.g. a restored draft)', (c) => {
    expect(showMinorCounters({ ...zero, full: 1, [c]: 1 }, false)).toBe(true);
  });
  it('covers every non-adult category', () => {
    expect([...MINOR_CATEGORIES].sort()).toEqual(CATEGORIES.filter((c) => !['full', 'tenK', 'companion'].includes(c)).sort());
  });
});
