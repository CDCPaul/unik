'use client';

import { RUNNER_CATEGORIES, TSHIRT_SIZES, hasRoomChoice, missingFields } from '@unik/shared/domain';
import type { Traveler } from '@unik/shared/domain';
import { CATEGORY_KEYS } from '@/lib/admin/format';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { MessageKey, Msg } from '@/lib/admin/i18n/translate';
import { Field } from './ui';

const FIELD_LABELS: Record<string, MessageKey> = {
  passportName: 'traveler.field.passportName',
  dob: 'traveler.field.dob',
  gender: 'traveler.field.gender',
  nationality: 'traveler.field.nationality',
  tshirtSize: 'traveler.field.tshirtSize',
  expectedFinish: 'traveler.field.expectedFinish',
  recentMarathon: 'traveler.field.recentMarathon',
  room: 'traveler.field.room',
  emergencyContact: 'traveler.field.emergencyContact',
};

function TravelerCard({
  index,
  traveler,
  editing,
  errors,
  onChange,
}: {
  index: number;
  traveler: Traveler;
  editing: boolean;
  errors: Record<string, Msg>;
  onChange: (t: Traveler) => void;
}) {
  const { t } = useAdminT();
  const fieldLabel = (f: string) => (FIELD_LABELS[f] ? t(FIELD_LABELS[f]) : f);
  const missing = missingFields(traveler);
  const runner = RUNNER_CATEGORIES.includes(traveler.category);
  const roomChoice = hasRoomChoice(traveler.category);
  const err = (f: string) => {
    const m = errors[`travelers.${index}.${f}`];
    return m ? t(m) : undefined;
  };
  const set = <K extends keyof Traveler>(k: K, v: Traveler[K] | '') => onChange({ ...traveler, [k]: v === '' ? undefined : v });
  const text = (k: 'passportName' | 'nationality' | 'expectedFinish' | 'recentMarathon' | 'emergencyContact') => (
    <Field label={fieldLabel(k)} error={err(k)}><input className="admin-input !py-1.5" value={traveler[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></Field>
  );

  function displayValue(k: string, v: string | undefined): string {
    if (!v) return '—';
    if (k === 'gender' && (v === 'female' || v === 'male')) return t(`traveler.gender.${v}`);
    if (k === 'room' && (v === 'twin' || v === 'single')) return t(`traveler.room.${v}`);
    return v;
  }
  return (
    <details className="rounded-lg border border-slate-200" open={editing || undefined}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <span className="font-semibold">{t('traveler.title', { n: index + 1 })}</span>
        <span className="text-slate-500">{CATEGORY_KEYS[traveler.category] ? t(CATEGORY_KEYS[traveler.category]) : traveler.category}</span>
        <span className="truncate text-slate-700">{traveler.passportName ?? ''}</span>
        {missing.length > 0 ? <span className="admin-badge ml-auto bg-amber-100 text-amber-800">{t('traveler.missingCount', { n: missing.length })}</span> : <span className="admin-badge ml-auto bg-green-100 text-green-800">{t('traveler.complete')}</span>}
      </summary>
      <div className="border-t border-slate-100 px-3 py-3">
        {missing.length > 0 ? <p className="mb-2 text-xs text-amber-700">{t('traveler.missingList', { fields: missing.map(fieldLabel).join(', ') })}</p> : null}
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            {text('passportName')}
            <Field label={fieldLabel('dob')} error={err('dob')}><input type="date" className="admin-input !py-1.5" value={traveler.dob ?? ''} onChange={(e) => set('dob', e.target.value)} /></Field>
            <Field label={fieldLabel('gender')}>
              <select className="admin-input !py-1.5" value={traveler.gender ?? ''} onChange={(e) => set('gender', e.target.value as Traveler['gender'] | '')}>
                <option value="">—</option><option value="female">{t('traveler.gender.female')}</option><option value="male">{t('traveler.gender.male')}</option>
              </select>
            </Field>
            {text('nationality')}
            {runner ? (
              <Field label={fieldLabel('tshirtSize')}>
                <select className="admin-input !py-1.5" value={traveler.tshirtSize ?? ''} onChange={(e) => set('tshirtSize', e.target.value as Traveler['tshirtSize'] | '')}>
                  <option value="">—</option>{TSHIRT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            ) : null}
            {runner ? text('expectedFinish') : null}
            {runner ? <div className="col-span-2">{text('recentMarathon')}</div> : null}
            {roomChoice ? (
              <Field label={fieldLabel('room')}>
                <select className="admin-input !py-1.5" value={traveler.room ?? ''} onChange={(e) => set('room', e.target.value as Traveler['room'] | '')}>
                  <option value="">—</option><option value="twin">{t('traveler.room.twin')}</option><option value="single">{t('traveler.room.single')}</option>
                </select>
              </Field>
            ) : null}
            {text('emergencyContact')}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {([['passportName', traveler.passportName], ['dob', traveler.dob], ['gender', traveler.gender], ['nationality', traveler.nationality], ...(runner ? [['tshirtSize', traveler.tshirtSize], ['expectedFinish', traveler.expectedFinish]] : []), ...(roomChoice ? [['room', traveler.room]] : []), ['emergencyContact', traveler.emergencyContact]] as [string, string | undefined][]).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{fieldLabel(k)}</dt><dd>{displayValue(k, v)}</dd></div>
            ))}
            {runner && traveler.recentMarathon ? <div className="contents"><dt className="text-slate-500">{fieldLabel('recentMarathon')}</dt><dd>{traveler.recentMarathon}</dd></div> : null}
          </dl>
        )}
      </div>
    </details>
  );
}

export function TravelerCards({
  travelers,
  editing,
  errors,
  onChange,
}: {
  travelers: Traveler[];
  editing: boolean;
  errors: Record<string, Msg>;
  onChange: (index: number, t: Traveler) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {travelers.map((t, i) => <TravelerCard key={i} index={i} traveler={t} editing={editing} errors={errors} onChange={(next) => onChange(i, next)} />)}
    </div>
  );
}
