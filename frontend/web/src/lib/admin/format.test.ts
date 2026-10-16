import { describe, expect, it } from 'vitest';
import { APPLICATION_STATUSES, CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT_LABELS, describeCounts } from '@unik/shared/domain';
import { CATEGORY_KEYS, CATEGORY_SHORT_KEYS, STATUS_KEYS, STATUS_LABELS, countsMessages, formatManila } from './format';
import { translate } from './i18n/translate';

describe('format', () => {
  it('formats Manila time', () => {
    expect(formatManila(new Date('2026-10-19T16:30:00Z'))).toBe('2026-10-20 00:30');
    expect(formatManila(null)).toBe('—');
  });
  it('labels every status', () => {
    expect(STATUS_LABELS.deposit_paid).toBe('Deposit paid');
    expect(Object.keys(STATUS_LABELS)).toHaveLength(7);
  });
  it('English screen labels match the CSV/shared labels', () => {
    for (const s of APPLICATION_STATUSES) expect(translate('en', STATUS_KEYS[s])).toBe(STATUS_LABELS[s]);
    for (const c of CATEGORIES) {
      expect(translate('en', CATEGORY_KEYS[c])).toBe(CATEGORY_LABELS[c]);
      expect(translate('en', CATEGORY_SHORT_KEYS[c])).toBe(CATEGORY_SHORT_LABELS[c]);
    }
  });
  it('describes counts like describeCounts in English and in Korean', () => {
    const counts = { full: 2, tenK: 0, companion: 1, child: 0, infant: 1 };
    expect(countsMessages(counts).map((m) => translate('en', m)).join(', ')).toBe(describeCounts(counts));
    expect(countsMessages(counts).map((m) => translate('ko', m)).join(', ')).toBe('풀코스 2명, 동반자 1명, 유아(24개월 미만) 1명');
  });
});
