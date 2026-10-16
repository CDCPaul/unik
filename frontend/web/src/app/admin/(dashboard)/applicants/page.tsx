'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { subscribeTourConfig } from '@/lib/services/admin/tourConfig';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import { ApplicantsList } from './ApplicantsList';
import { ApplicantDetail } from './ApplicantDetail';

function Loader() {
  const { t } = useAdminT();
  return <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label={t('common.loading')} role="status" />;
}

// 2xl(1536px) 미만에서는 상세를 오버레이 드로어로 띄운다 (1366px 노트북에서 나란히 두면 좁다)
const DRAWER_QUERY = '(max-width: 1535px)';

function useIsDrawer(): boolean {
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DRAWER_QUERY);
    const update = () => setDrawer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return drawer;
}

function ApplicantsPageInner() {
  const { t } = useAdminT();
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('id');
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [error, setError] = useState(false);
  const isDrawer = useIsDrawer();
  const prevSelected = useRef<string | null>(null);

  useEffect(() => {
    const off1 = subscribeApplications(setApps, () => setError(true));
    const off2 = subscribeTourConfig(setConfig, () => undefined);
    return () => {
      off1();
      off2();
    };
  }, []);

  const selected = selectedId && apps ? apps.find((a) => a.id === selectedId) ?? null : null;
  const select = useCallback(
    (id: string | null) => router.replace(id ? `/admin/applicants?id=${encodeURIComponent(id)}` : '/admin/applicants', { scroll: false }),
    [router],
  );

  // 드로어일 때는 Escape 로 닫는다 (입력 중인 Escape 는 무시)
  useEffect(() => {
    if (!selectedId || !isDrawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, isDrawer, select]);

  // 드로어가 열려 있는 동안 뒤 화면 스크롤을 잠근다
  useEffect(() => {
    if (!selectedId || !isDrawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedId, isDrawer]);

  // 닫으면 그 신청의 App no. 버튼으로 포커스를 돌려준다
  useEffect(() => {
    const prev = prevSelected.current;
    prevSelected.current = selectedId;
    if (prev && !selectedId) {
      document.querySelector<HTMLElement>(`[data-app-id="${CSS.escape(prev)}"]`)?.focus();
    }
  }, [selectedId]);

  if (error) return <p className="admin-card p-6 text-red-600">{t('applicants.loadFailed')}</p>;
  if (!apps) return <Loader />;

  return (
    <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1">
        <ApplicantsList apps={apps} config={config} selectedId={selectedId} onSelect={select} />
      </div>
      {selectedId ? (
        <>
          <div className="fixed inset-0 z-30 bg-slate-900/40 2xl:hidden" aria-hidden="true" onClick={() => select(null)} />
          <aside
            aria-label={selected ? (isDrawer ? undefined : t('applicants.detailsLabel')) : t('applicants.notFoundLabel')}
            role={isDrawer ? 'dialog' : undefined}
            aria-modal={isDrawer ? true : undefined}
            aria-labelledby={isDrawer && selected ? 'applicant-detail-heading' : undefined}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-[480px] overflow-y-auto bg-slate-100 p-3 shadow-2xl 2xl:sticky 2xl:inset-auto 2xl:top-6 2xl:z-auto 2xl:max-h-[calc(100vh-3rem)] 2xl:w-[460px] 2xl:max-w-none 2xl:shrink-0 2xl:bg-transparent 2xl:p-0 2xl:shadow-none"
          >
            {selected ? (
              <ApplicantDetail key={selected.id} app={selected} config={config} onClose={() => select(null)} />
            ) : (
              <div className="admin-card flex flex-col items-start gap-3 p-6 text-sm text-slate-600">
                <p>{t('applicants.notFound')}</p>
                <button type="button" className="admin-btn-secondary" onClick={() => select(null)}>{t('applicants.backToList')}</button>
              </div>
            )}
          </aside>
        </>
      ) : null}
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ApplicantsPageInner />
    </Suspense>
  );
}
