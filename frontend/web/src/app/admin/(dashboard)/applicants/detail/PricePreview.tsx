'use client';

import { formatPHP } from '@unik/shared/domain';
import type { Pricing } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { paidExceedsNote } from '@/lib/admin/detailHelpers';

/** 재계산 결과 미리보기: 총액·예약금 변화와 경고 */
export function PricePreview({ app, pricing, warnings }: { app: ApplicationRecord; pricing: Pricing; warnings: string[] }) {
  const exceeds = paidExceedsNote(app.paidTotal, pricing.total);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="price-preview">
      <p>Total: <span className="font-semibold">{formatPHP(app.pricing.total)}</span> → <span className="font-bold text-slate-900">{formatPHP(pricing.total)}</span></p>
      <p>Deposit due: <span className="font-semibold">{formatPHP(app.pricing.depositDue)}</span> → <span className="font-bold text-slate-900">{formatPHP(pricing.depositDue)}</span></p>
      {[...warnings, ...(exceeds ? [exceeds] : [])].map((w) => (
        <p key={w} className="mt-1 rounded bg-amber-50 px-2 py-1 text-amber-800">{w}</p>
      ))}
    </div>
  );
}
