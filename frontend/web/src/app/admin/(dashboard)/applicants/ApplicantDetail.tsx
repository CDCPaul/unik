'use client';

import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';

// Task 9 에서 전체 상세 패널로 교체한다.
export function ApplicantDetail({ app, onClose }: { app: ApplicationRecord; config: TourConfig | null; onClose: () => void }) {
  return (
    <div className="admin-card p-5">
      <button type="button" className="admin-btn-secondary" onClick={onClose}>Close</button>
      <p className="mt-3 font-bold">{app.appNo}</p>
    </div>
  );
}
