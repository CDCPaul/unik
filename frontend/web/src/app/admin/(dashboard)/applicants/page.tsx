'use client';

import { Suspense, useEffect, useState } from 'react';
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

  if (error) return <p className="admin-card p-6 text-red-600">{error}</p>;
  if (!apps) return <Loader />;

  const selected = selectedId ? apps.find((a) => a.id === selectedId) ?? null : null;
  const select = (id: string | null) => router.replace(id ? `/admin/applicants?id=${encodeURIComponent(id)}` : '/admin/applicants', { scroll: false });

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_720px]">
        <ApplicantsList apps={apps} config={config} selectedId={selectedId} onSelect={select} />
      </div>
      {selectedId ? (
        <div className="min-w-0 flex-[1_1_380px] xl:sticky xl:top-6">
          {selected ? (
            <ApplicantDetail app={selected} config={config} onClose={() => select(null)} />
          ) : (
            <p className="admin-card p-6 text-sm text-slate-600">Application not found. It may have been removed from this list.</p>
          )}
        </div>
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
