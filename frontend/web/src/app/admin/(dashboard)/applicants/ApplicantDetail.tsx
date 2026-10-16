'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatPHP } from '@unik/shared/domain';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { STATUS_BADGE, STATUS_KEYS, formatManila } from '@/lib/admin/format';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import { ContactSection } from './detail/ContactSection';
import { EmailsSection } from './detail/EmailsSection';
import { NotesSection } from './detail/NotesSection';
import { PaymentsSection } from './detail/PaymentsSection';
import { StatusSection } from './detail/StatusSection';
import { TravelersSection } from './detail/TravelersSection';

export function ApplicantDetail({ app, config, onClose }: { app: ApplicationRecord; config: TourConfig | null; onClose: () => void }) {
  const { t } = useAdminT();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // 다른 신청을 열 때마다 제목으로 포커스를 옮긴다 (드로어로 열렸을 때 키보드 사용자를 위해)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [app.id]);

  const promo = app.pricing.promo;
  return (
    <div className="admin-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 id="applicant-detail-heading" ref={headingRef} tabIndex={-1} className="text-lg font-bold text-slate-900 outline-none">{app.appNo} · {app.lead.firstName} {app.lead.lastName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className={`admin-badge ${STATUS_BADGE[app.status]}`}>{t(STATUS_KEYS[app.status])}</span>
            <span>{t('detail.applied', { date: formatManila(app.createdAt) })}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{app.departure.label || app.departure.id} · {app.departure.departDate}{app.departure.returnDate ? ` – ${app.departure.returnDate}` : ''}</p>
          <p className="text-sm text-slate-600">{promo ? `${promo.code} · ${promo.agencyName}${promo.discountTotal > 0 ? ` · −${formatPHP(promo.discountTotal)}` : ''}` : t('common.direct')}</p>
        </div>
        <button type="button" aria-label={t('common.close')} className="admin-btn-secondary !p-2" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <StatusSection app={app} />
      <ContactSection app={app} />
      <TravelersSection app={app} config={config} />
      <PaymentsSection app={app} config={config} />
      <NotesSection app={app} />
      <EmailsSection app={app} />
    </div>
  );
}
