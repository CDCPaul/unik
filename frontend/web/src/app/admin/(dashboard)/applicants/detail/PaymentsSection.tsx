'use client';

import { useState } from 'react';
import { PAYMENT_METHODS, PAYMENT_TYPES, formatPHP, manilaDate, mayaPaymentLink } from '@unik/shared/domain';
import type { ApplicationStatus, PaymentMethod, PaymentType, TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { PAYMENT_METHOD_KEYS, PAYMENT_TYPE_KEYS, defaultPaymentType, paidAtFromDate } from '@/lib/admin/detailHelpers';
import { parseAmount } from '@/lib/admin/edits';
import { STATUS_KEYS, formatManila } from '@/lib/admin/format';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { MessageKey } from '@/lib/admin/i18n/translate';
import { getCurrentUser } from '@/lib/auth';
import { addPaymentTx, changeStatusTx, voidPaymentTx } from '@/lib/services/admin/applications';
import { Field, Section, SaveError, useCopy, useSave } from './ui';

const today = () => manilaDate(new Date());

function PaymentForm({ app }: { app: ApplicationRecord }) {
  const { t } = useAdminT();
  const [type, setType] = useState<PaymentType>(() => defaultPaymentType(app.paidTotal, app.pricing.depositDue));
  const [method, setMethod] = useState<PaymentMethod>('maya_qr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<{ amount?: MessageKey; date?: MessageKey }>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: MessageKey } | null>(null);
  const { saving, failed, run } = useSave();

  async function submit() {
    const parsed = parseAmount(amount);
    const paidAt = paidAtFromDate(date);
    const found: { amount?: MessageKey; date?: MessageKey } = {};
    if (parsed === null) found.amount = 'detail.payment.amountError';
    if (!paidAt) found.date = 'detail.payment.dateError';
    else if (date > today()) found.date = 'detail.payment.futureDate';
    setErrors(found);
    if (parsed === null || !paidAt || found.date) return;
    const remaining = Math.max(app.pricing.total - app.paidTotal, 0);
    if (parsed > remaining && !window.confirm(t('detail.payment.overBalance', { amount: formatPHP(remaining) }))) return;
    const by = getCurrentUser()?.email ?? 'unknown';
    const ref = reference.trim();
    const out: { suggested: ApplicationStatus | null } = { suggested: null };
    setNotice(null);
    const ok = await run(async () => {
      const r = await addPaymentTx(app.id, { type, method, amount: parsed, paidAt, ...(ref ? { reference: ref } : {}) }, by);
      out.suggested = r.suggestedStatus;
    });
    if (!ok) return;
    setAmount('');
    setReference('');
    setType(defaultPaymentType(app.paidTotal + parsed, app.pricing.depositDue));
    setNotice({ ok: true, text: 'detail.payment.saved' });
    const next = out.suggested;
    if (next && window.confirm(t('detail.payment.savedChangeStatus', { status: { key: STATUS_KEYS[next] } }))) {
      try {
        await changeStatusTx(app.id, next, by);
      } catch (e) {
        console.error(e);
        setNotice({ ok: false, text: 'detail.payment.statusFailed' });
      }
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">{t('detail.payment.record')}</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('detail.payment.type')}><select className="admin-input !py-1.5" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>{PAYMENT_TYPES.map((pt) => <option key={pt} value={pt}>{t(PAYMENT_TYPE_KEYS[pt])}</option>)}</select></Field>
        <Field label={t('detail.payment.method')}><select className="admin-input !py-1.5" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(PAYMENT_METHOD_KEYS[m])}</option>)}</select></Field>
        <Field label={t('detail.payment.amount')} error={errors.amount && t(errors.amount)}><input className="admin-input !py-1.5" inputMode="numeric" placeholder="10,000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label={t('detail.payment.paidDate')} error={errors.date && t(errors.date)}><input type="date" className="admin-input !py-1.5" max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={t('detail.payment.reference')} className="col-span-2"><input className="admin-input !py-1.5" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
      </div>
      <button type="button" className="admin-btn-primary mt-3 !py-1.5" disabled={saving} onClick={submit}>{saving ? t('common.saving') : t('detail.payment.save')}</button>
      <SaveError show={failed} />
      {notice ? <p role={notice.ok ? 'status' : 'alert'} className={`mt-2 text-sm ${notice.ok ? 'text-green-700' : 'text-red-600'}`}>{t(notice.text)}</p> : null}
    </div>
  );
}

export function PaymentsSection({ app, config }: { app: ApplicationRecord; config: TourConfig | null }) {
  const { t } = useAdminT();
  const { saving, failed, run } = useSave();
  const { copied, copy } = useCopy();
  const balance = app.pricing.total - app.paidTotal;
  const base = config?.mayaPaymentLinkBase ?? null;
  const depositRemaining = Math.max(app.pricing.depositDue - app.paidTotal, 0);
  // 취소·대기 신청에는 결제 링크를 만들지 않는다 (결제 기록은 가능)
  const linksAllowed = app.status !== 'cancelled' && app.status !== 'waitlist';
  const depositLink = linksAllowed && depositRemaining > 0 ? mayaPaymentLink(base, depositRemaining) : null;
  const balanceLink = linksAllowed && balance > 0 ? mayaPaymentLink(base, balance) : null;
  const payments = [...app.payments].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

  async function voidIt(id: string, label: string) {
    if (!window.confirm(t('detail.payments.voidConfirm', { label }))) return;
    const by = getCurrentUser()?.email ?? 'unknown';
    await run(() => voidPaymentTx(app.id, id, by));
  }

  return (
    <Section title={t('detail.payments.title')}>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {([['detail.payments.total', app.pricing.total], ['detail.payments.depositDue', app.pricing.depositDue], ['detail.payments.paid', app.paidTotal], ['detail.payments.balance', balance]] as [MessageKey, number][]).map(([k, v]) => (
          <div key={k}><dt className="text-xs text-slate-500">{t(k)}</dt><dd className={`font-bold ${k === 'detail.payments.balance' && v < 0 ? 'text-amber-700' : 'text-slate-900'}`}>{formatPHP(v)}</dd></div>
        ))}
      </dl>
      {payments.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {payments.map((p) => {
            const typeLabel = PAYMENT_TYPE_KEYS[p.type] ? t(PAYMENT_TYPE_KEYS[p.type]) : p.type;
            const methodLabel = PAYMENT_METHOD_KEYS[p.method] ? t(PAYMENT_METHOD_KEYS[p.method]) : p.method;
            const label = `${formatPHP(p.amount)} ${typeLabel}`;
            return (
              <li key={p.id} className="flex items-start justify-between gap-2 py-2">
                <div>
                  <p className={`font-semibold ${p.voidedAt ? 'text-slate-400 line-through' : ''}`}>{formatPHP(p.amount)} · {typeLabel} · {methodLabel}</p>
                  <p className={`text-xs text-slate-500 ${p.voidedAt ? 'line-through' : ''}`}>{manilaDate(p.paidAt)}{p.reference ? ` · ${t('detail.payments.reference', { reference: p.reference })}` : ''} · {p.recordedBy}</p>
                  {p.voidedAt ? <p className="text-xs font-semibold text-red-600">{t('detail.payments.voidedBy', { by: p.voidedBy || t('common.unknown'), at: formatManila(p.voidedAt) })}</p> : null}
                </div>
                {p.voidedAt ? null : <button type="button" className="text-xs font-semibold text-red-600 underline disabled:opacity-50" disabled={saving} onClick={() => voidIt(p.id, label)}>{t('detail.payments.void')}</button>}
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-500">{t('detail.payments.none')}</p>}
      <SaveError show={failed} />
      {depositLink || balanceLink ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {depositLink ? <button type="button" className="admin-btn-secondary !py-1.5 text-sm" onClick={() => copy('deposit', depositLink)}>{copied === 'deposit' ? t('common.copied') : t('detail.payments.copyDepositLink', { amount: formatPHP(depositRemaining) })}</button> : null}
          {balanceLink ? <button type="button" className="admin-btn-secondary !py-1.5 text-sm" onClick={() => copy('balance', balanceLink)}>{copied === 'balance' ? t('common.copied') : t('detail.payments.copyBalanceLink', { amount: formatPHP(balance) })}</button> : null}
        </div>
      ) : null}
      <PaymentForm app={app} />
    </Section>
  );
}
