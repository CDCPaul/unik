'use client';

import { useMemo, useState } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, buildTravelers, computeCompleteness, describeCounts, manilaDate } from '@unik/shared/domain';
import type { Category, Counts, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { cleanTraveler, droppedTravelers, droppedWarning } from '@/lib/admin/detailHelpers';
import { recalculate, validateTravelers } from '@/lib/admin/edits';
import type { TourConfig } from '@unik/shared/domain';
import { updateApplicationFields } from '@/lib/services/admin/applications';
import { PricePreview } from './PricePreview';
import { TravelerCards } from './TravelerCards';
import { Section, SaveError, useSave } from './ui';

const isDirty = (draft: Counts | null, base: Counts) => draft !== null && !CATEGORIES.every((c) => draft[c] === base[c]);

function CountsEditor({ app, config, draft, setDraft, locked }: { app: ApplicationRecord; config: TourConfig | null; draft: Counts | null; setDraft: (c: Counts | null) => void; locked: boolean }) {
  const { saving, failed, run, clearFailed } = useSave();
  const counts = draft ?? app.counts;
  const dirty = isDirty(draft, app.counts);
  const result = useMemo(() => (dirty ? recalculate(app, { counts: draft! }, config) : null), [app, config, dirty, draft]);
  const dropped = useMemo(() => (dirty ? droppedTravelers(app.travelers, draft!) : []), [app.travelers, dirty, draft]);

  const bump = (c: Category, delta: number) => {
    clearFailed();
    setDraft({ ...counts, [c]: Math.max(0, counts[c] + delta) });
  };

  async function apply() {
    if (!result || 'error' in result) return;
    const ok = await run(() => updateApplicationFields(app.id, { counts, travelers: result.travelers.map(cleanTraveler), completeness: result.completeness, pricing: result.pricing }));
    if (ok) setDraft(null);
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex items-center gap-2 text-sm">
            <span className="w-28 text-slate-700">{CATEGORY_LABELS[c]}</span>
            <button type="button" aria-label={`Decrease ${CATEGORY_LABELS[c]}`} className="admin-btn-secondary !p-1.5" disabled={counts[c] <= 0 || saving || locked} onClick={() => bump(c, -1)}><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-5 text-center font-bold" aria-live="polite">{counts[c]}</span>
            <button type="button" aria-label={`Increase ${CATEGORY_LABELS[c]}`} className="admin-btn-secondary !p-1.5" disabled={saving || locked} onClick={() => bump(c, 1)}><Plus className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Staff changes are not limited by seats/bibs — check Tour settings usage.</p>
      {dirty && result ? (
        <div className="mt-3 flex flex-col gap-2">
          {'error' in result ? (
            <p role="alert" className="text-sm text-red-600">{result.error}</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">New counts: {describeCounts(counts)}</p>
              <PricePreview app={app} pricing={result.pricing} warnings={[...result.warnings, ...dropped.map(droppedWarning)]} />
            </>
          )}
          <div className="flex gap-2">
            <button type="button" className="admin-btn-primary !py-1.5" disabled={saving || 'error' in result} onClick={apply}>{saving ? 'Saving…' : 'Apply new counts'}</button>
            <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={() => { setDraft(null); clearFailed(); }}>Reset</button>
          </div>
        </div>
      ) : null}
      <SaveError show={failed} />
    </div>
  );
}

export function TravelersSection({ app, config }: { app: ApplicationRecord; config: TourConfig | null }) {
  const [draft, setDraft] = useState<Traveler[] | null>(null);
  const [countsDraft, setCountsDraft] = useState<Counts | null>(null);
  const countsDirty = isDirty(countsDraft, app.counts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState('');
  const { saving, failed, run, clearFailed } = useSave();
  const live = useMemo(() => buildTravelers(app.counts, app.travelers), [app.counts, app.travelers]);
  const shown = draft ?? live;
  const departureKnown = !!config?.departures.some((d) => d.id === app.departure.id);
  const preview = useMemo(() => (draft ? recalculate(app, { travelers: draft.map(cleanTraveler) }, config) : null), [app, config, draft]);
  const priceChanged = preview && !('error' in preview) && (preview.pricing.total !== app.pricing.total || preview.warnings.length > 0);

  const start = () => { setDraft(live.map((t) => ({ ...t }))); setErrors({}); setBlocked(''); clearFailed(); };
  const cancel = () => { setDraft(null); setErrors({}); setBlocked(''); clearFailed(); };

  async function save() {
    if (!draft) return;
    setBlocked('');
    const cleaned = draft.map(cleanTraveler);
    const found = validateTravelers(cleaned, manilaDate(new Date()));
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    let fields: Record<string, unknown>;
    if (config && !departureKnown) {
      // 출발편이 설정에서 사라졌으면 가격은 건드리지 않는다
      fields = { travelers: cleaned, completeness: computeCompleteness(cleaned) };
    } else {
      const r = recalculate(app, { travelers: cleaned }, config);
      if ('error' in r) return setBlocked(r.error);
      fields = { travelers: r.travelers.map(cleanTraveler), completeness: r.completeness, pricing: r.pricing };
    }
    if (await run(() => updateApplicationFields(app.id, fields))) setDraft(null);
  }

  return (
    <Section
      title={`Travelers (${describeCounts(app.counts) || 'none'})`}
      actions={!draft ? <button type="button" className="admin-btn-secondary !px-3 !py-1 text-sm" disabled={countsDirty} title={countsDirty ? 'Apply or reset the new counts first' : undefined} onClick={start}><Pencil className="h-3.5 w-3.5" /> Edit travelers</button> : null}
    >
      <CountsEditor app={app} config={config} draft={countsDraft} setDraft={setCountsDraft} locked={!!draft} />
      <TravelerCards travelers={shown} editing={!!draft} errors={errors} onChange={(i, t) => setDraft((d) => (d ? d.map((x, j) => (j === i ? t : x)) : d))} />
      {draft ? (
        <div className="mt-3 flex flex-col gap-2">
          {priceChanged && preview && !('error' in preview) ? <PricePreview app={app} pricing={preview.pricing} warnings={preview.warnings} /> : null}
          {config && !departureKnown ? <p className="text-sm text-amber-700">This departure is no longer in tour settings; prices will not be recalculated.</p> : null}
          {blocked ? <p role="alert" className="text-sm text-red-600">{blocked}</p> : null}
          {Object.keys(errors).length > 0 ? <p role="alert" className="text-sm text-red-600">Fix the highlighted fields to save.</p> : null}
          <div className="flex gap-2">
            <button type="button" className="admin-btn-primary !py-1.5" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save travelers'}</button>
            <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={cancel}>Cancel</button>
          </div>
          <SaveError show={failed} />
        </div>
      ) : null}
    </Section>
  );
}
