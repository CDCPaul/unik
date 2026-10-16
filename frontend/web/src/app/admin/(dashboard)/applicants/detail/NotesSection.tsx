'use client';

import { useState } from 'react';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { updateApplicationFields } from '@/lib/services/admin/applications';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import { Section, SaveError, useSave } from './ui';

export function NotesSection({ app }: { app: ApplicationRecord }) {
  const { t } = useAdminT();
  // null 이면 실시간 값을 따라가고, 입력을 시작하면 그 값을 붙잡는다
  const [draft, setDraft] = useState<string | null>(null);
  const [base, setBase] = useState<string | null>(null); // 입력을 시작할 때 보였던 값
  const { saving, failed, run } = useSave();
  const value = draft ?? app.staffNotes ?? '';
  const dirty = draft !== null && draft.trim() !== (app.staffNotes ?? '').trim();

  const edit = (v: string) => {
    if (draft === null) setBase((app.staffNotes ?? '').trim());
    setDraft(v);
  };
  const reset = () => { setDraft(null); setBase(null); };

  async function save() {
    const live = (app.staffNotes ?? '').trim();
    if (base !== null && live !== base && !window.confirm(t('detail.notes.overwrite'))) return;
    if (await run(() => updateApplicationFields(app.id, { staffNotes: value.trim() || null }))) reset();
  }

  return (
    <>
      <Section title={t('detail.notes.specialRequests')}>
        {app.specialRequests ? <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{app.specialRequests}</p> : <p className="text-sm text-slate-500">{t('common.none')}</p>}
      </Section>
      <Section title={t('detail.notes.staffNotes')}>
        <textarea aria-label={t('detail.notes.staffNotes')} className="admin-input min-h-[88px]" maxLength={2000} value={value} onChange={(e) => edit(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className="admin-btn-primary !py-1.5" disabled={saving || !dirty} onClick={save}>{saving ? t('common.saving') : t('detail.notes.save')}</button>
          {dirty ? <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={reset}>{t('detail.notes.discard')}</button> : null}
        </div>
        <SaveError show={failed} />
      </Section>
    </>
  );
}
