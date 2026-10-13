'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { subscribeTourConfig } from '@/lib/services/admin/tourConfig';
import { ApplicantsList } from './ApplicantsList';
import { ApplicantDetail } from './ApplicantDetail';

function Loader() {
  return <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Loading" role="status" />;
}

function ApplicantsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('id');
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const off1 = subscribeApplications(setApps, () => setError('Could not load applications. Check your connection and refresh.'));
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

  // xl 미만에서는 상세가 오버레이 드로어이므로 Escape 로 닫는다 (입력 중인 Escape 는 무시)
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!window.matchMedia('(max-width: 1279px)').matches) return;
      select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, select]);

  if (error) return <p className="admin-card p-6 text-red-600">{error}</p>;
  if (!apps) return <Loader />;

  return (
    <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1">
        <ApplicantsList apps={apps} config={config} selectedId={selectedId} onSelect={select} />
      </div>
      {selectedId ? (
        <>
          <div className="fixed inset-0 z-30 bg-slate-900/40 xl:hidden" aria-hidden="true" onClick={() => select(null)} />
          <aside
            aria-label="Applicant details"
            className="fixed inset-y-0 right-0 z-40 w-full max-w-[480px] overflow-y-auto bg-slate-100 p-3 shadow-2xl xl:sticky xl:inset-auto xl:top-6 xl:z-auto xl:max-h-[calc(100vh-3rem)] xl:w-[460px] xl:max-w-none xl:shrink-0 xl:bg-transparent xl:p-0 xl:shadow-none"
          >
            {selected ? (
              <ApplicantDetail app={selected} config={config} onClose={() => select(null)} />
            ) : (
              <div className="admin-card flex flex-col items-start gap-3 p-6 text-sm text-slate-600">
                <p>Application not found. It may have been removed from this list.</p>
                <button type="button" className="admin-btn-secondary" onClick={() => select(null)}>Back to list</button>
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
