'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { internationalDigits, viberLink, whatsappLink } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { leadChanges } from '@/lib/admin/detailHelpers';
import { normalizeLead, validateLead } from '@/lib/admin/edits';
import { updateApplicationFields } from '@/lib/services/admin/applications';
import { Field, Section, SaveError, useSave } from './ui';

type Lead = ApplicationRecord['lead'];

export function ContactSection({ app }: { app: ApplicationRecord }) {
  const [draft, setDraft] = useState<Lead | null>(null);
  // 편집을 시작한 시점의 값. 저장 때 이것과 비교해야 다른 직원의 수정을 되돌리지 않는다.
  const [base, setBase] = useState<Lead | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { saving, failed, run, clearFailed } = useSave();
  const l = app.lead;
  const viber = l.viber ? viberLink(l.phoneDial, l.phoneNumber) : null;
  const wa = l.whatsapp ? whatsappLink(l.phoneDial, l.phoneNumber) : null;
  // 국내 표기(0917…)여도 국제 형식(+63917…)으로 전화를 건다. 해석이 안 되면 입력 그대로.
  const intl = internationalDigits(l.phoneDial, l.phoneNumber);
  const tel = intl ? `+${intl}` : `${l.phoneDial}${l.phoneNumber.replace(/\D/g, '')}`;

  const start = () => { setDraft({ ...l }); setBase({ ...l }); setErrors({}); clearFailed(); };
  const cancel = () => { setDraft(null); setBase(null); setErrors({}); clearFailed(); };

  async function save() {
    if (!draft || !base) return;
    const found = validateLead(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // 바꾼 필드만 쓴다 (다른 직원이 동시에 고친 다른 필드를 덮지 않도록)
    const changes = leadChanges(normalizeLead(base), normalizeLead(draft));
    if (Object.keys(changes).length === 0) return cancel();
    if (await run(() => updateApplicationFields(app.id, changes))) cancel();
  }

  if (!draft) {
    return (
      <Section title="Contact" actions={<button type="button" className="admin-btn-secondary !px-3 !py-1 text-sm" onClick={start}><Pencil className="h-3.5 w-3.5" /> Edit</button>}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd className="break-all"><a className="text-blue-700 underline" href={`mailto:${l.email}`}>{l.email}</a></dd>
          <dt className="text-slate-500">Phone</dt>
          <dd><a className="text-blue-700 underline" href={`tel:${tel}`}>{l.phoneDial} {l.phoneNumber}</a></dd>
        </dl>
        {viber || wa ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {viber ? <a className="admin-btn-secondary !px-3 !py-1 text-sm" href={viber}>Viber</a> : null}
            {wa ? <a className="admin-btn-secondary !px-3 !py-1 text-sm" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}
          </div>
        ) : null}
      </Section>
    );
  }

  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  return (
    <Section title="Contact">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors['lead.firstName']}><input className="admin-input" value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
        <Field label="Last name" error={errors['lead.lastName']}><input className="admin-input" value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
        <Field label="Email" className="col-span-2" error={errors['lead.email']}><input type="email" className="admin-input" value={draft.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Country code"><input className="admin-input" value={draft.phoneDial} onChange={(e) => set('phoneDial', e.target.value)} /></Field>
        <Field label="Mobile number" error={errors['lead.phoneNumber']}><input className="admin-input" inputMode="tel" value={draft.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={draft.viber} onChange={(e) => set('viber', e.target.checked)} /> Viber</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.checked)} /> WhatsApp</label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="admin-btn-primary !py-1.5" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save contact'}</button>
        <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={cancel}>Cancel</button>
      </div>
      <SaveError show={failed} />
    </Section>
  );
}
