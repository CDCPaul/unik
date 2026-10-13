'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  RUNNER_CATEGORIES,
  TSHIRT_SIZES,
  formatPHP,
  hasRoomChoice,
  isValidPrice,
  manilaDate,
  missingPriceCategories,
  normalizePromoCode,
  totalPax,
  validateCounts,
} from '@unik/shared/domain';
import type { Availability, Category, TourConfig } from '@unik/shared/domain';
import { DIAL_CODES } from '@/lib/data/dialCodes';
import { checkPromo, submitWithRetry } from '@/lib/apply/api';
import { clearDraft, loadDraft, saveDraft } from '@/lib/apply/draft';
import { PROMO_REASON_MESSAGES, describeSubmitError } from '@/lib/apply/errors';
import { resolveInitialState } from '@/lib/apply/init';
import { applyReducer, estimatePricing, initialApplyState, toSubmitPayload, validateForSubmit } from '@/lib/apply/model';
import type { ApplyState, TravelerField } from '@/lib/apply/model';
import { clearPromoCode, loadPromoCode, savePromoCode } from '@/lib/promo/storage';
import { browserStore } from '@/lib/store';
import { departureStatus, subscribeTourData } from '@/lib/tour/publicData';

const field = 'min-h-12 w-full rounded-xl border-2 border-brand-line bg-white px-3.5 font-medium text-brand-ink';
const card = 'm-0 flex flex-col gap-4 rounded-[20px] border-0 bg-white p-6 sm:p-7';
const legend = 'float-left mb-1 w-full p-0 text-xl font-extrabold text-brand-ink';

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
}

// 인원 선택 줄의 이름과 안내
const COUNTER_TITLES: Record<Category, string> = {
  full: 'Full Marathon runner',
  tenK: '10K runner',
  companion: 'Companion (non-runner)',
  child: CATEGORY_LABELS.child,
  infant: CATEGORY_LABELS.infant,
};
const COUNTER_HINTS: Partial<Record<Category, string>> = {
  child: 'Ages 2–11 on the travel dates',
  infant: 'Under 2 years old on the travel dates',
};

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="text-sm font-semibold text-brand-red">{msg}</p> : null;
}

export function ApplyForm() {
  const router = useRouter();
  const [state, dispatch] = useReducer(applyReducer, null, () => initialApplyState(newKey()));
  const [data, setData] = useState<{ config: TourConfig | null; availability: Availability | null }>({ config: null, availability: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openTraveler, setOpenTraveler] = useState<number | null>(0);
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  const initialized = useRef(false);
  const pristineRef = useRef<ApplyState | null>(null);
  const pendingAutoCode = useRef<string | null>(null);
  const promoInputRef = useRef('');
  promoInputRef.current = state.promoInput;

  // 임시저장 복원 + 추천코드 시작값(주소의 ?code= 가 저장된 코드·임시저장보다 우선). StrictMode 에서도 한 번만 실행.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const store = browserStore();
    const now = Date.now();
    const urlCode = searchParams.get('code');
    if (urlCode) savePromoCode(store, urlCode, now);
    const { state: next, autoCheckCode } = resolveInitialState({
      draft: loadDraft(store),
      urlCode,
      storedCode: loadPromoCode(store, now),
      freshKey: state.idempotencyKey,
      base: state,
    });
    dispatch({ type: 'restore', state: next });
    pristineRef.current = next;
    pendingAutoCode.current = autoCheckCode;
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 사용자가 바꾼 뒤에만 저장한다(복원 직후의 빈 상태를 덮어쓰지 않음).
  useEffect(() => {
    if (hydrated && state !== pristineRef.current) saveDraft(browserStore(), state);
  }, [hydrated, state]);

  useEffect(
    () =>
      subscribeTourData(
        (d) => {
          setData(d);
          setLoadError(false);
          setLoading(false);
        },
        () => setLoadError(true),
      ),
    [],
  );

  // 복원·저장된 코드가 있으면 한 번만 자동 확인한다. 직접 입력한 코드는 자동 확인하지 않는다.
  useEffect(() => {
    if (!hydrated) return;
    const pending = pendingAutoCode.current;
    pendingAutoCode.current = null;
    if (pending && normalizePromoCode(state.promoInput) === pending && !state.promo) void applyPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const pricing = useMemo(() => (data.config ? estimatePricing(state, data.config) : null), [state, data.config]);
  const pax = totalPax(state.counts);
  const countsError = validateCounts(state.counts);
  const accepting = data.config?.acceptingApplications ?? false;

  async function applyPromo() {
    const code = state.promoInput.trim();
    if (!code) return;
    setCheckingPromo(true);
    setPromoMessage('');
    try {
      const r = await checkPromo(code, pax);
      if (normalizePromoCode(promoInputRef.current) !== normalizePromoCode(code)) return; // 확인 중 입력이 바뀜
      if (r.valid) {
        dispatch({
          type: 'promoApplied',
          promo: { code: r.code, agencyName: r.agencyName, discountType: r.discountType, discountValue: r.discountValue, description: r.description },
        });
      } else {
        dispatch({ type: 'promoCleared' });
        setPromoMessage(PROMO_REASON_MESSAGES[r.reason]);
      }
    } catch {
      if (normalizePromoCode(promoInputRef.current) !== normalizePromoCode(code)) return;
      setPromoMessage("We couldn't check the code right now. You can still submit; we'll verify it.");
    } finally {
      setCheckingPromo(false);
    }
  }

  // Enter 는 폼 제출이 아니라 코드 확인으로 동작한다.
  function onPromoKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!checkingPromo && state.promoInput.trim()) void applyPromo();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    const found = validateForSubmit(state, manilaDate(new Date()));
    if (
      !found.departureId &&
      state.departureId &&
      data.config &&
      departureStatus(data.config, data.availability, state.departureId, state.counts) === 'closed'
    ) {
      found.departureId = 'This departure is no longer available. Please choose another one.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      const travelerMatch = /^travelers\.(\d+)\./.exec(first);
      if (travelerMatch) setOpenTraveler(Number(travelerMatch[1]));
      requestAnimationFrame(() =>
        (
          document.querySelector<HTMLElement>(`[data-field="${first}"]:not(:disabled)`) ??
          document.querySelector<HTMLElement>(`[data-field="${first}"]`)
        )?.focus(),
      );
      return;
    }
    setSubmitting(true);
    // 제출을 시도했다는 사실을 먼저 남긴다(전송 중 새로고침해도 같은 키로 재시도하도록).
    dispatch({ type: 'markSubmitAttempted' });
    saveDraft(browserStore(), { ...state, submitAttempted: true });
    try {
      const res = await submitWithRetry(toSubmitPayload(state));
      const store = browserStore();
      clearDraft(store);
      clearPromoCode(store);
      const duplicate = res.duplicate ? '&duplicate=1' : '';
      router.push(`/apply/thanks?app=${encodeURIComponent(res.appNo)}&status=${encodeURIComponent(res.status)}${duplicate}`);
    } catch (err) {
      const d = describeSubmitError(err);
      if (d.kind === 'promo_invalid') {
        dispatch({ type: 'promoCleared' });
        setPromoMessage(d.message);
      }
      if (d.kind === 'invalid_input' && d.issues) {
        setErrors(Object.fromEntries(d.issues.map((i) => [i.path, i.message])));
      }
      setSubmitError(d.message);
      setSubmitting(false);
    }
  }

  if (!loading && (!data.config || !accepting)) {
    return (
      <div className="rounded-[20px] bg-white p-8">
        <p className="text-xl font-extrabold text-brand-ink">Applications are currently closed.</p>
        <p>
          Please <a href="/contact" className="font-bold text-brand-red">contact us</a> and we will let you know when slots open.
        </p>
      </div>
    );
  }

  const departures = data.config?.departures ?? [];
  const selectedDeparture = departures.find((d) => d.id === state.departureId);
  const unpriced = selectedDeparture ? missingPriceCategories(selectedDeparture.prices, state.counts) : [];

  return (
    <div className="flex flex-wrap items-start gap-8">
      <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
        {/* 1. Departure */}
        <fieldset className={card}>
          <legend className={legend}>1. Choose your departure</legend>
          {loadError && !data.config ? (
            <p role="alert" className="font-semibold text-brand-red">We couldn&apos;t load departures. Please refresh the page or contact us.</p>
          ) : loading ? (
            <p>Loading departures…</p>
          ) : null}
          {departures.map((d) => {
            const status = data.config ? departureStatus(data.config, data.availability, d.id, state.counts) : 'closed';
            const selected = state.departureId === d.id;
            return (
              <label
                key={d.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 px-5 py-4 ${selected ? 'border-brand-red' : 'border-brand-line'} ${status === 'closed' ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="departure"
                  data-field="departureId"
                  className="h-5 w-5 accent-brand-red"
                  checked={selected}
                  disabled={status === 'closed'}
                  onChange={() => dispatch({ type: 'setDeparture', departureId: d.id })}
                />
                <span className="flex-[1_1_200px]">
                  <span className="block font-extrabold text-brand-ink">{d.label}</span>
                  <span className="text-sm">{d.departDate} to {d.returnDate}</span>
                </span>
                <span className="text-sm font-bold text-brand-red">
                  {status === 'closed' ? 'Closed' : status === 'full' ? 'Full · join the waitlist' : 'Available'}
                </span>
              </label>
            );
          })}
          <FieldError id="err-departure" msg={errors.departureId} />
        </fieldset>

        {/* 2. Travelers */}
        <fieldset className={card}>
          <legend className={legend}>2. Who&apos;s going?</legend>
          {CATEGORIES.map((c: Category) => {
            const dep = departures.find((d) => d.id === state.departureId);
            const unit = dep?.prices?.[c];
            const price = !dep
              ? 'Choose a departure to see prices'
              : isValidPrice(unit)
                ? `${formatPHP(unit)} per person`
                : 'Not available for this departure';
            const hint = COUNTER_HINTS[c];
            return (
              <div key={c} className="flex flex-wrap items-center gap-3 border-b border-brand-line py-3.5 last:border-0">
                <div className="flex-[1_1_240px]">
                  <p className="font-extrabold text-brand-ink">{COUNTER_TITLES[c]}</p>
                  {hint ? <p className="text-sm">{hint}</p> : null}
                  <p className="text-sm">{price}</p>
                </div>
                <div className="flex items-center gap-3.5">
                  <button type="button" aria-label={`Remove one ${CATEGORY_LABELS[c]}`} onClick={() => dispatch({ type: 'changeCount', category: c, delta: -1 })} className="h-11 w-11 rounded-full border-2 border-brand-line bg-white text-2xl font-bold text-brand-ink">−</button>
                  <span className="min-w-6 text-center text-xl font-extrabold text-brand-ink" aria-live="polite">{state.counts[c]}</span>
                  <button type="button" aria-label={`Add one ${CATEGORY_LABELS[c]}`} onClick={() => dispatch({ type: 'changeCount', category: c, delta: 1 })} className="h-11 w-11 rounded-full bg-brand-red text-2xl font-bold text-white">+</button>
                </div>
              </div>
            );
          })}
          <p className="text-sm">Up to 10 travelers per application, including children and infants. Children and infants must travel with an adult.</p>
          <div data-field="counts" tabIndex={-1} className="outline-none">
            <FieldError id="err-counts" msg={countsError ?? undefined} />
          </div>
        </fieldset>

        {/* 3. Contact */}
        <fieldset className={card}>
          <legend className={legend}>3. Your contact details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['firstName', 'lastName'] as const).map((f) => (
              <label key={f} className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {f === 'firstName' ? 'First name *' : 'Last name *'}
                <input data-field={`lead.${f}`} className={field} value={state.lead[f]} autoComplete={f === 'firstName' ? 'given-name' : 'family-name'} aria-invalid={!!errors[`lead.${f}`]} onChange={(e) => dispatch({ type: 'setLead', field: f, value: e.target.value })} />
                <FieldError id={`err-${f}`} msg={errors[`lead.${f}`]} />
              </label>
            ))}
            <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Email *
              <input data-field="lead.email" type="email" className={field} value={state.lead.email} autoComplete="email" aria-invalid={!!errors['lead.email']} onChange={(e) => dispatch({ type: 'setLead', field: 'email', value: e.target.value })} />
              <FieldError id="err-email" msg={errors['lead.email']} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Mobile number *
              <span className="flex gap-2">
                <select aria-label="Country code" className={`${field} w-24`} value={state.lead.phoneDial} onChange={(e) => dispatch({ type: 'setLead', field: 'phoneDial', value: e.target.value })}>
                  {DIAL_CODES.map((d) => <option key={d.code} value={d.code}>{d.code}</option>)}
                </select>
                <input data-field="lead.phoneNumber" type="tel" aria-label="Mobile number" className={`${field} min-w-0 flex-1`} value={state.lead.phoneNumber} autoComplete="tel-national" placeholder="917 123 4567" aria-invalid={!!errors['lead.phoneNumber']} onChange={(e) => dispatch({ type: 'setLead', field: 'phoneNumber', value: e.target.value })} />
              </span>
              <FieldError id="err-phone" msg={errors['lead.phoneNumber']} />
            </label>
          </div>
          <div className="flex flex-wrap gap-5 text-[15px]">
            {(['viber', 'whatsapp'] as const).map((f) => (
              <label key={f} className="flex min-h-11 items-center gap-2 py-1">
                <input type="checkbox" className="h-5 w-5 accent-brand-red" checked={state.lead[f]} onChange={(e) => dispatch({ type: 'setLead', field: f, value: e.target.checked })} />
                Reachable on {f === 'viber' ? 'Viber' : 'WhatsApp'}
              </label>
            ))}
          </div>
          {/* honeypot: 화면·스크린리더에서 숨김 */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={state.website} onChange={(e) => dispatch({ type: 'setHoneypot', value: e.target.value })} /></label>
          </div>
        </fieldset>

        {/* 4. Traveler details (optional) */}
        <fieldset className={card}>
          <legend className="float-left mb-1 flex w-full flex-wrap items-center gap-2.5 p-0">
            <span className="text-xl font-extrabold text-brand-ink">4. Traveler details</span>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[13px] font-bold text-brand-ink">Optional</span>
          </legend>
          <p className="text-[15px]">Busy? Skip this section. Our team will collect these details from you later.</p>
          {state.travelers.map((t, i) => {
            const open = openTraveler === i;
            const isRunner = RUNNER_CATEGORIES.includes(t.category);
            const text = (f: TravelerField, label: string, extra: Record<string, string> = {}) => (
              <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {label}
                <input data-field={`travelers.${i}.${f}`} className={field} value={(t[f] as string | undefined) ?? ''} aria-invalid={!!errors[`travelers.${i}.${f}`]} onChange={(e) => dispatch({ type: 'setTraveler', index: i, field: f, value: e.target.value })} {...extra} />
                <FieldError id={`err-t${i}-${f}`} msg={errors[`travelers.${i}.${f}`]} />
              </label>
            );
            const select = (f: TravelerField, label: string, options: readonly (readonly [string, string])[]) => (
              <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {label}
                <select className={field} value={(t[f] as string | undefined) ?? ''} onChange={(e) => dispatch({ type: 'setTraveler', index: i, field: f, value: e.target.value })}>
                  <option value="">Select</option>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            );
            return (
              <div key={i} className="rounded-2xl border-2 border-brand-line">
                <button type="button" aria-expanded={open} onClick={() => setOpenTraveler(open ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-extrabold text-brand-ink">Traveler {i + 1} · {CATEGORY_LABELS[t.category]}</span>
                  <span className="font-bold text-brand-red">{open ? 'Hide' : 'Add details +'}</span>
                </button>
                {open ? (
                  <div className="grid gap-3.5 px-5 pb-5 sm:grid-cols-2">
                    {text('passportName', 'Name as in passport', { autoComplete: 'off' })}
                    {text('dob', 'Date of birth', { type: 'date' })}
                    {select('gender', 'Gender', [['female', 'Female'], ['male', 'Male']])}
                    {text('nationality', 'Nationality')}
                    {isRunner ? select('tshirtSize', 'T-shirt size', TSHIRT_SIZES.map((s) => [s, s] as const)) : null}
                    {isRunner ? text('expectedFinish', 'Expected finish time', { placeholder: 'e.g. 4:30' }) : null}
                    {hasRoomChoice(t.category) ? select('room', 'Room', [['twin', 'Twin share'], ['single', 'Single (supplement applies)']]) : null}
                    {text('emergencyContact', 'Emergency contact', { placeholder: 'Name and phone' })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>

        {/* 5. Promo */}
        <fieldset className={card}>
          <legend className={legend}>5. Promo code</legend>
          <p className="text-[15px]">Referred by a travel agency? Enter the code they gave you.</p>
          <div className="flex flex-wrap gap-2.5">
            <label className="flex flex-[1_1_240px] flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Promo code
              <input data-field="promoInput" className={`${field} font-bold tracking-[0.06em]`} value={state.promoInput} autoCapitalize="characters" aria-invalid={!!errors.promoInput} onChange={(e) => dispatch({ type: 'setPromoInput', value: e.target.value })} onKeyDown={onPromoKeyDown} />
              <FieldError id="err-promo" msg={errors.promoInput} />
            </label>
            <button type="button" onClick={() => void applyPromo()} disabled={checkingPromo || !state.promoInput.trim()} className="min-h-12 self-end rounded-xl bg-brand-ink px-6 font-extrabold text-white disabled:opacity-50">
              {checkingPromo ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {state.promo ? (
            <p className="rounded-xl bg-[#E8F5EC] px-4 py-3 text-[15px] font-semibold text-[#145C33]">
              Code applied: {state.promo.agencyName} · {state.promo.description}
            </p>
          ) : null}
          {promoMessage ? <p role="alert" className="text-sm font-semibold text-brand-red">{promoMessage}</p> : null}
        </fieldset>

        {/* 6. Finish */}
        <fieldset className={card}>
          <legend className={legend}>6. Anything else?</legend>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
            Special requests (optional)
            <textarea data-field="specialRequests" rows={3} maxLength={1000} className={`${field} py-3`} placeholder="Dietary needs, rooming with a friend, questions…" value={state.specialRequests} aria-invalid={!!errors.specialRequests} onChange={(e) => dispatch({ type: 'setSpecialRequests', value: e.target.value })} />
            <FieldError id="err-requests" msg={errors.specialRequests} />
          </label>
          <label className="flex min-h-11 items-start gap-2.5 py-1 text-[15px]">
            <input data-field="agreedToTerms" type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-red" checked={state.agreedToTerms} onChange={(e) => dispatch({ type: 'setAgreed', value: e.target.checked })} />
            <span>
              I agree to the <a href="/terms" target="_blank" className="font-bold text-brand-red">Terms</a>,{' '}
              <a href="/privacy" target="_blank" className="font-bold text-brand-red">Privacy Policy</a> and{' '}
              <a href="/refund-policy" target="_blank" className="font-bold text-brand-red">Refund Policy</a>. *
            </span>
          </label>
          <FieldError id="err-terms" msg={errors.agreedToTerms} />
          {submitError ? <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-3 font-semibold text-brand-red">{submitError}</p> : null}
          {pricing ? (
            <p className="text-center text-[15px] font-bold text-brand-ink lg:hidden">
              Estimated total {formatPHP(pricing.total)} · deposit {formatPHP(pricing.depositDue)}
            </p>
          ) : null}
          <button type="submit" disabled={submitting} className="min-h-[60px] rounded-full bg-brand-red text-lg font-extrabold text-white disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          <p className="text-center text-sm">No payment is taken now.</p>
        </fieldset>
      </form>

      {/* Summary */}
      <aside aria-label="Booking summary" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 rounded-[20px] border-t-[6px] border-brand-red bg-white p-7 lg:sticky lg:top-6">
        <p className="text-xl font-extrabold text-brand-ink">Your booking</p>
        <div className="flex justify-between gap-3 text-[15px]">
          <span>Departure</span>
          <span className="font-bold text-brand-ink">{departures.find((d) => d.id === state.departureId)?.label ?? 'Not selected'}</span>
        </div>
        <div className="h-px bg-brand-line" />
        {pricing ? (
          <>
            {pricing.lines.map((l) => (
              <div key={l.category} className="flex justify-between gap-3 text-[15px]">
                <span>{l.qty} × {CATEGORY_LABELS[l.category]}</span>
                <span className="font-bold text-brand-ink">{formatPHP(l.amount)}</span>
              </div>
            ))}
            {pricing.singleSupplements > 0 ? (
              <div className="flex justify-between gap-3 text-[15px]"><span>Single room supplement</span><span className="font-bold text-brand-ink">{formatPHP(pricing.singleSupplements)}</span></div>
            ) : null}
            {pricing.promo ? (
              <div className="flex justify-between gap-3 text-[15px] text-[#145C33]"><span>Promo {pricing.promo.code}</span><span className="font-bold">−{formatPHP(pricing.promo.discountTotal)}</span></div>
            ) : null}
            {pricing.promo && state.counts.infant > 0 ? <p className="text-sm">Promo discounts do not apply to infants.</p> : null}
            <div className="h-px bg-brand-line" />
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-extrabold text-brand-ink">Estimated total</span>
              <span className="text-[26px] font-extrabold text-brand-ink">{formatPHP(pricing.total)}</span>
            </div>
            <p className="rounded-xl bg-brand-soft px-4 py-3.5 text-sm">
              After we confirm your slot, a deposit of <b className="text-brand-ink">{formatPHP(pricing.depositDue)}</b> is due. Pay by card, GCash, Maya or bank transfer.
            </p>
          </>
        ) : (
          <p className="text-sm">
            {unpriced.length > 0
              ? `${unpriced.map((c) => CATEGORY_LABELS[c]).join(', ')}: not available for this departure.`
              : 'Choose a departure to see your estimated total.'}
          </p>
        )}
      </aside>
    </div>
  );
}
