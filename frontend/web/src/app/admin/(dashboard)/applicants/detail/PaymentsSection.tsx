'use client';

import { useState } from 'react';
import { PAYMENT_METHODS, PAYMENT_TYPES, formatPHP, manilaDate, mayaPaymentLink } from '@unik/shared/domain';
import type { ApplicationStatus, PaymentMethod, PaymentType, TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, defaultPaymentType, paidAtFromDate } from '@/lib/admin/detailHelpers';
import { parseAmount } from '@/lib/admin/edits';
import { STATUS_LABELS } from '@/lib/admin/format';
import { getCurrentUser } from '@/lib/auth';
import { addPaymentTx, changeStatusTx, removePaymentTx } from '@/lib/services/admin/applications';
import { Field, Section, SaveError, useCopy, useSave } from './ui';

const today = () => manilaDate(new Date());

function PaymentForm({ app }: { app: ApplicationRecord }) {
  const [type, setType] = useState<PaymentType>(() => defaultPaymentType(app.paidTotal, app.pricing.depositDue));
  const [method, setMethod] = useState<PaymentMethod>('maya_qr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const { saving, failed, run } = useSave();

  async function submit() {
    const parsed = parseAmount(amount);
    const paidAt = paidAtFromDate(date);
    const found: { amount?: string; date?: string } = {};
    if (parsed === null) found.amount = 'Enter whole pesos, e.g. 10,000';
    if (!paidAt) found.date = 'Enter a valid date.';
    else if (date > today()) found.date = 'The paid date cannot be in the future.';
    setErrors(found);
    if (parsed === null || !paidAt || found.date) return;
    const remaining = Math.max(app.pricing.total - app.paidTotal, 0);
    if (parsed > remaining && !window.confirm(`This is more than the remaining balance of ${formatPHP(remaining)}. Record anyway?`)) return;
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
    setNotice({ ok: true, text: 'Payment saved.' });
    const next = out.suggested;
    if (next && window.confirm(`Payment saved. Change status to ${STATUS_LABELS[next]}?`)) {
      try {
        await changeStatusTx(app.id, next, by);
      } catch (e) {
        console.error(e);
        setNotice({ ok: false, text: 'Payment saved, but the status could not be changed — update it in the Status section.' });
      }
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Record payment</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><select className="admin-input !py-1.5" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>{PAYMENT_TYPES.map((t) => <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>)}</select></Field>
        <Field label="Method"><select className="admin-input !py-1.5" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}</select></Field>
        <Field label="Amount (PHP)" error={errors.amount}><input className="admin-input !py-1.5" inputMode="numeric" placeholder="10,000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Paid date" error={errors.date}><input type="date" className="admin-input !py-1.5" max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Reference (optional)" className="col-span-2"><input className="admin-input !py-1.5" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
      </div>
      <button type="button" className="admin-btn-primary mt-3 !py-1.5" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Save payment'}</button>
      <SaveError show={failed} />
      {notice ? <p role={notice.ok ? 'status' : 'alert'} className={`mt-2 text-sm ${notice.ok ? 'text-green-700' : 'text-red-600'}`}>{notice.text}</p> : null}
    </div>
  );
}

export function PaymentsSection({ app, config }: { app: ApplicationRecord; config: TourConfig | null }) {
  const { saving, failed, run } = useSave();
  const { copied, copy } = useCopy();
  const balance = app.pricing.total - app.paidTotal;
  const base = config?.mayaPaymentLinkBase ?? null;
  const depositRemaining = Math.max(app.pricing.depositDue - app.paidTotal, 0);
  const depositLink = depositRemaining > 0 ? mayaPaymentLink(base, depositRemaining) : null;
  const balanceLink = balance > 0 ? mayaPaymentLink(base, balance) : null;
  const payments = [...app.payments].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

  async function remove(id: string, label: string) {
    if (!window.confirm(`Remove this payment (${label})? The paid total will be recalculated.`)) return;
    await run(() => removePaymentTx(app.id, id));
  }

  return (
    <Section title="Payments">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {([['Total', app.pricing.total], ['Deposit due', app.pricing.depositDue], ['Paid', app.paidTotal], ['Balance', balance]] as [string, number][]).map(([k, v]) => (
          <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className={`font-bold ${k === 'Balance' && v < 0 ? 'text-amber-700' : 'text-slate-900'}`}>{formatPHP(v)}</dd></div>
        ))}
      </dl>
      {payments.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {payments.map((p) => {
            const label = `${formatPHP(p.amount)} ${PAYMENT_TYPE_LABELS[p.type] ?? p.type}`;
            return (
              <li key={p.id} className="flex items-start justify-between gap-2 py-2">
                <div>
                  <p className="font-semibold">{formatPHP(p.amount)} · {PAYMENT_TYPE_LABELS[p.type] ?? p.type} · {PAYMENT_METHOD_LABELS[p.method] ?? p.method}</p>
                  <p className="text-xs text-slate-500">{manilaDate(p.paidAt)}{p.reference ? ` · Ref ${p.reference}` : ''} · {p.recordedBy}</p>
                </div>
                <button type="button" className="text-xs font-semibold text-red-600 underline disabled:opacity-50" disabled={saving} onClick={() => remove(p.id, label)}>Remove</button>
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-500">No payments recorded yet.</p>}
      <SaveError show={failed} />
      {depositLink || balanceLink ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {depositLink ? <button type="button" className="admin-btn-secondary !py-1.5 text-sm" onClick={() => copy('deposit', depositLink)}>{copied === 'deposit' ? 'Copied' : `Copy deposit link (${formatPHP(depositRemaining)})`}</button> : null}
          {balanceLink ? <button type="button" className="admin-btn-secondary !py-1.5 text-sm" onClick={() => copy('balance', balanceLink)}>{copied === 'balance' ? 'Copied' : `Copy balance link (${formatPHP(balance)})`}</button> : null}
        </div>
      ) : null}
      <PaymentForm app={app} />
    </Section>
  );
}
