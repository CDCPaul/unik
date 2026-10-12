import { CATEGORIES, CATEGORY_LABELS } from './types';
import type { Counts } from './types';

export function formatAppNo(seq: number): string {
  return `APP-${String(seq).padStart(4, '0')}`;
}

export function formatPHP(amount: number): string {
  return `PHP ${amount.toLocaleString('en-US')}`;
}

export function describeCounts(counts: Counts): string {
  return CATEGORIES.filter((c) => counts[c] > 0)
    .map((c) => `${counts[c]} ${CATEGORY_LABELS[c]}`)
    .join(', ');
}
