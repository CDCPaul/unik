'use client';

import { CATEGORY_LABELS, TSHIRT_SIZES, missingFields } from '@unik/shared/domain';
import type { Traveler } from '@unik/shared/domain';
import { Field } from './ui';

const FIELD_LABELS: Record<string, string> = {
  passportName: 'Passport name',
  dob: 'Date of birth',
  gender: 'Gender',
  nationality: 'Nationality',
  tshirtSize: 'T-shirt size',
  expectedFinish: 'Expected finish',
  room: 'Room',
  emergencyContact: 'Emergency contact',
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
  errors: Record<string, string>;
  onChange: (t: Traveler) => void;
}) {
  const missing = missingFields(traveler);
  const runner = traveler.category !== 'companion';
  const err = (f: string) => errors[`travelers.${index}.${f}`];
  const set = <K extends keyof Traveler>(k: K, v: Traveler[K] | '') => onChange({ ...traveler, [k]: v === '' ? undefined : v });
  const text = (k: 'passportName' | 'nationality' | 'expectedFinish' | 'recentMarathon' | 'emergencyContact', label: string) => (
    <Field label={label} error={err(k)}><input className="admin-input !py-1.5" value={traveler[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></Field>
  );

  return (
    <details className="rounded-lg border border-slate-200" open={editing || undefined}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <span className="font-semibold">Traveler {index + 1}</span>
        <span className="text-slate-500">{CATEGORY_LABELS[traveler.category]}</span>
        <span className="truncate text-slate-700">{traveler.passportName ?? ''}</span>
        {missing.length > 0 ? <span className="admin-badge ml-auto bg-amber-100 text-amber-800">{missing.length} missing</span> : <span className="admin-badge ml-auto bg-green-100 text-green-800">Complete</span>}
      </summary>
      <div className="border-t border-slate-100 px-3 py-3">
        {missing.length > 0 ? <p className="mb-2 text-xs text-amber-700">Missing: {missing.map((f) => FIELD_LABELS[f] ?? f).join(', ')}</p> : null}
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            {text('passportName', 'Passport name')}
            <Field label="Date of birth" error={err('dob')}><input type="date" className="admin-input !py-1.5" value={traveler.dob ?? ''} onChange={(e) => set('dob', e.target.value)} /></Field>
            <Field label="Gender">
              <select className="admin-input !py-1.5" value={traveler.gender ?? ''} onChange={(e) => set('gender', e.target.value as Traveler['gender'] | '')}>
                <option value="">—</option><option value="female">Female</option><option value="male">Male</option>
              </select>
            </Field>
            {text('nationality', 'Nationality')}
            {runner ? (
              <Field label="T-shirt size">
                <select className="admin-input !py-1.5" value={traveler.tshirtSize ?? ''} onChange={(e) => set('tshirtSize', e.target.value as Traveler['tshirtSize'] | '')}>
                  <option value="">—</option>{TSHIRT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            ) : null}
            {runner ? text('expectedFinish', 'Expected finish') : null}
            {runner ? <div className="col-span-2">{text('recentMarathon', 'Recent marathon')}</div> : null}
            <Field label="Room">
              <select className="admin-input !py-1.5" value={traveler.room ?? ''} onChange={(e) => set('room', e.target.value as Traveler['room'] | '')}>
                <option value="">—</option><option value="twin">Twin share</option><option value="single">Single</option>
              </select>
            </Field>
            {text('emergencyContact', 'Emergency contact')}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {([['passportName', traveler.passportName], ['dob', traveler.dob], ['gender', traveler.gender], ['nationality', traveler.nationality], ...(runner ? [['tshirtSize', traveler.tshirtSize], ['expectedFinish', traveler.expectedFinish]] : []), ['room', traveler.room], ['emergencyContact', traveler.emergencyContact]] as [string, string | undefined][]).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{FIELD_LABELS[k]}</dt><dd>{v || '—'}</dd></div>
            ))}
            {runner && traveler.recentMarathon ? <div className="contents"><dt className="text-slate-500">Recent marathon</dt><dd>{traveler.recentMarathon}</dd></div> : null}
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
  errors: Record<string, string>;
  onChange: (index: number, t: Traveler) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {travelers.map((t, i) => <TravelerCard key={i} index={i} traveler={t} editing={editing} errors={errors} onChange={(next) => onChange(i, next)} />)}
    </div>
  );
}
