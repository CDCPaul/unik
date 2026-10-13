'use client';

import { useMemo, useState } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, buildTravelers, describeCounts, manilaDate } from '@unik/shared/domain';
import type { Category, Counts, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { cleanTraveler, droppedTravelers, droppedWarning } from '@/lib/admin/detailHelpers';
import { recalculate, repriceForTravelers, validateTravelers } from '@/lib/admin/edits';
import type { TourConfig } from '@unik/shared/domain';
import { applyCountsTx, isConflictError, saveTravelersTx } from '@/lib/services/admin/applications';
import { PricePreview } from './PricePreview';
import { TravelerCards } from './TravelerCards';
import { Section, SaveError, useSave } from './ui';

const sameCounts = (a: Counts, b: Counts) => CATEGORIES.every((c) => a[c] === b[c]);
const isDirty = (draft: CountsDraft | null, live: Counts) => draft !== null && !sameCounts(draft.value, live);

/** base 는 편집을 시작한 시점의 인원 (그 사이 다른 직원이 바꿨는지 확인용) */
interface CountsDraft { base: Counts; value: Counts }

function CountsEditor({ app, config, draft, setDraft, locked }: { app: ApplicationRecord; config: TourConfig | null; draft: CountsDraft | null; setDraft: (c: CountsDraft | null) => void; locked: boolean }) {
  const { saving, failed, run, clearFailed } = useSave();
  const [conflict, setConflict] = useState('');
  const counts = draft?.value ?? app.counts;
  const dirty = isDirty(draft, app.counts);
  const result = useMemo(() => (dirty ? recalculate(app, { counts: draft!.value }, config) : null), [app, config, dirty, draft]);
  const dropped = useMemo(() => (dirty ? droppedTravelers(app.travelers, draft!.value) : []), [app.travelers, dirty, draft]);

  const bump = (c: Category, delta: number) => {
    clearFailed();
    setConflict('');
    setDraft({ base: draft?.base ?? app.counts, value: { ...counts, [c]: Math.max(0, counts[c] + delta) } });
  };

  async function apply() {
    if (!result || 'error' in result || !draft) return;
    let conflicted = false;
    const ok = await run(async () => {
      try {
        await applyCountsTx(app.id, draft.base, counts, config);
      } catch (e) {
        if (!isConflictError(e)) throw e;
        conflicted = true;
      }
    });
    if (conflicted) {
      setDraft(null);
      setConflict('Counts were changed by someone else — review the new counts and try again.');
    } else if (ok) setDraft(null);
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex items-center gap-2 text-sm">
            <span className="w-32 text-slate-700">{CATEGORY_LABELS[c]}</span>
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
            <button type="button" className="admin-btn-secondary !py-1.5" disabled={saving} onClick={() => { setDraft(null); setConflict(''); clearFailed(); }}>Reset</button>
          </div>
        </div>
      ) : null}
      {conflict ? <p role="alert" className="mt-2 text-sm text-red-600">{conflict}</p> : null}
      <SaveError show={failed} />
    </div>
  );
}

export function TravelersSection({ app, config }: { app: ApplicationRecord; config: TourConfig | null }) {
  // base 는 편집을 시작한 시점의 참가자 (저장 때 실제로 바꾼 필드만 최신 값에 다시 적용하기 위함)
  const [edit, setEdit] = useState<{ base: Traveler[]; baseCounts: Counts; draft: Traveler[] } | null>(null);
  const draft = edit?.draft ?? null;
  const [countsDraft, setCountsDraft] = useState<CountsDraft | null>(null);
  const countsDirty = isDirty(countsDraft, app.counts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState('');
  const { saving, failed, run, clearFailed } = useSave();
  const live = useMemo(() => buildTravelers(app.counts, app.travelers), [app.counts, app.travelers]);
  const shown = draft ?? live;
  const departureKnown = !!config?.departures.some((d) => d.id === app.departure.id);
  const preview = useMemo(() => (draft ? repriceForTravelers(app, draft.map(cleanTraveler), config) : null), [app, config, draft]);
  const priceChanged = preview && !('error' in preview) && (preview.pricing.total !== app.pricing.total || preview.warnings.length > 0);

  const start = () => { setEdit({ base: live.map((t) => ({ ...t })), baseCounts: { ...app.counts }, draft: live.map((t) => ({ ...t })) }); setErrors({}); setBlocked(''); clearFailed(); };
  const cancel = () => { setEdit(null); setErrors({}); setBlocked(''); clearFailed(); };

  async function save() {
    if (!edit) return;
    setBlocked('');
    const found = validateTravelers(edit.draft.map(cleanTraveler), manilaDate(new Date()));
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // 최신 문서 기준으로 바꾼 필드만 트랜잭션 안에서 병합한다 (다른 직원의 동시 수정을 덮지 않기 위해)
    let conflicted = false;
    let failure = '';
    const ok = await run(async () => {
      try {
        await saveTravelersTx(app.id, edit.baseCounts, edit.base, edit.draft, config);
      } catch (e) {
        if (isConflictError(e)) conflicted = true;
        else if (e instanceof Error && e.message === 'Tour settings are not loaded yet.') failure = e.message;
        else throw e;
      }
    });
    if (conflicted) {
      setEdit({ base: live.map((t) => ({ ...t })), baseCounts: { ...app.counts }, draft: live.map((t) => ({ ...t })) });
      setErrors({});
      setBlocked('Travelers were changed by someone else — review and re-apply your edits.');
    } else if (failure) setBlocked(failure);
    else if (ok) cancel();
  }

  return (
    <Section
      title={`Travelers (${describeCounts(app.counts) || 'none'})`}
      actions={!draft ? <button type="button" className="admin-btn-secondary !px-3 !py-1 text-sm" disabled={countsDirty} title={countsDirty ? 'Apply or reset the new counts first' : undefined} onClick={start}><Pencil className="h-3.5 w-3.5" /> Edit travelers</button> : null}
    >
      <CountsEditor app={app} config={config} draft={countsDraft} setDraft={setCountsDraft} locked={!!draft} />
      <TravelerCards travelers={shown} editing={!!draft} errors={errors} onChange={(i, t) => setEdit((e) => (e ? { ...e, draft: e.draft.map((x, j) => (j === i ? t : x)) } : e))} />
      {draft ? (
        <div className="mt-3 flex flex-col gap-2">
          {priceChanged && preview && !('error' in preview) ? <PricePreview app={app} pricing={preview.pricing} warnings={preview.warnings} /> : null}
          {config && !departureKnown ? <p className="text-sm text-amber-700">This departure is no longer in tour settings; the original single-room rate will be used.</p> : null}
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
