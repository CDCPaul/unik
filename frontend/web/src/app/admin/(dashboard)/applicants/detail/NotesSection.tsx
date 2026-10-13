'use client';

import { useState } from 'react';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { updateApplicationFields } from '@/lib/services/admin/applications';
import { Section, SaveError, useSave } from './ui';

export function NotesSection({ app }: { app: ApplicationRecord }) {
  // null 이면 실시간 값을 따라가고, 입력을 시작하면 그 값을 붙잡는다
  const [draft, setDraft] = useState<string | null>(null);
  const { saving, failed, run } = useSave();
  const value = draft ?? app.staffNotes ?? '';
  const dirty = draft !== null && draft.trim() !== (app.staffNotes ?? '').trim();

  async function save() {
    if (await run(() => updateApplicationFields(app.id, { staffNotes: value.trim() || null }))) setDraft(null);
  }

  return (
    <>
      <Section title="Special requests">
        {app.specialRequests ? <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{app.specialRequests}</p> : <p className="text-sm text-slate-500">None</p>}
      </Section>
      <Section title="Staff notes">
        <textarea aria-label="Staff notes" className="admin-input min-h-[88px]" maxLength={2000} value={value} onChange={(e) => setDraft(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className="admin-btn-primary !py-1.5" disabled={saving || !dirty} onClick={save}>{saving ? 'Saving…' : 'Save notes'}</button>
          {dirty ? <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={() => setDraft(null)}>Discard</button> : null}
        </div>
        <SaveError show={failed} />
      </Section>
    </>
  );
}
