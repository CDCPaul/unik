'use client';

import { useState } from 'react';
import { APPLICATION_STATUSES } from '@unik/shared/domain';
import type { ApplicationStatus } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { statusChangeWarnings } from '@/lib/admin/edits';
import { STATUS_LABELS, formatManila } from '@/lib/admin/format';
import { getCurrentUser } from '@/lib/auth';
import { changeStatusTx } from '@/lib/services/admin/applications';
import { Section, SaveError, useSave } from './ui';

export function StatusSection({ app }: { app: ApplicationRecord }) {
  // null 이면 실시간 상태를 그대로 따라간다 (사용자가 고른 동안에만 값을 붙잡는다)
  const [picked, setPicked] = useState<ApplicationStatus | null>(null);
  const { saving, failed, run } = useSave();
  const value = picked ?? app.status;
  const history = [...app.statusHistory].sort((a, b) => b.at.getTime() - a.at.getTime());

  async function update() {
    const warnings = statusChangeWarnings(app, value);
    if (warnings.length > 0 && !window.confirm(`${warnings.join('\n')}\n\nChange status to ${STATUS_LABELS[value]} anyway?`)) return;
    const ok = await run(() => changeStatusTx(app.id, value, getCurrentUser()?.email ?? 'unknown'));
    if (ok) setPicked(null);
  }

  return (
    <Section title="Status">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Status" className="admin-input !w-auto !py-1.5" value={value} onChange={(e) => setPicked(e.target.value as ApplicationStatus)}>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button type="button" className="admin-btn-primary !py-1.5" disabled={saving || value === app.status} onClick={update}>{saving ? 'Updating…' : 'Update'}</button>
      </div>
      <SaveError show={failed} />
      {history.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 text-xs text-slate-600">
          {history.map((e, i) => <li key={i}>{formatManila(e.at)} · {STATUS_LABELS[e.status] ?? e.status} · {e.by}</li>)}
        </ul>
      ) : null}
    </Section>
  );
}
