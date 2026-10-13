import type { DocumentData } from 'firebase-admin/firestore';
import { normalizeCounts, type ApplicationSummary } from '../shared-domain';

export function toSummary(data: DocumentData): ApplicationSummary {
  return {
    status: data.status,
    departureId: data.departure?.id ?? '',
    // 예전 신청서에는 child/infant 키가 없다
    counts: normalizeCounts(data.counts),
    promoCode: data.pricing?.promo?.code ?? null,
  };
}
