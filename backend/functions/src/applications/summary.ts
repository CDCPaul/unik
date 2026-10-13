import type { DocumentData } from 'firebase-admin/firestore';
import type { ApplicationSummary } from '../shared-domain';

export function toSummary(data: DocumentData): ApplicationSummary {
  return {
    status: data.status,
    departureId: data.departure?.id ?? '',
    counts: data.counts ?? { full: 0, tenK: 0, companion: 0 },
    promoCode: data.pricing?.promo?.code ?? null,
  };
}
