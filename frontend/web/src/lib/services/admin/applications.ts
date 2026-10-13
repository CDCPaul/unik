import { arrayUnion, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { ApplicationStatus, Counts, TourConfig, Traveler } from '@unik/shared/domain';
import { fromApplicationDoc } from '@/lib/admin/applicationDoc';
import type { ApplicationRecord, PaymentRecord } from '@/lib/admin/applicationDoc';
import { applyPayment, planCountsApply, planTravelersSave, withoutPayment } from '@/lib/admin/edits';
import type { TxPlan } from '@/lib/admin/edits';

const col = () => collection(db, COLLECTIONS.applications);
// 상태·결제 관련 필드는 changeStatusTx / addPaymentTx / removePaymentTx 로만 바꾼다
const PROTECTED_FIELDS = ['agreedToTermsAt', 'createdAt', 'appNo', 'status', 'statusHistory', 'payments', 'paidTotal'];

export function subscribeApplications(cb: (apps: ApplicationRecord[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    query(col(), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => fromApplicationDoc(d.id, d.data()))),
    onError,
  );
}

/** 바꾼 필드만 쓴다. agreedToTermsAt 등 다른 필드는 건드리지 않는다. */
export async function updateApplicationFields(id: string, fields: Record<string, unknown>): Promise<void> {
  if (PROTECTED_FIELDS.some((k) => k in fields)) throw new Error('Protected field');
  await updateDoc(doc(col(), id), { ...fields, updatedAt: serverTimestamp() });
}

// arrayUnion 으로 이력이 동시 편집에도 유실되지 않는다 (이름은 서비스 일관성을 위해 Tx 접미사 유지).
export async function changeStatusTx(id: string, next: ApplicationStatus, by: string): Promise<void> {
  await updateDoc(doc(col(), id), {
    status: next,
    statusHistory: arrayUnion({ status: next, at: new Date(), by }),
    updatedAt: serverTimestamp(),
  });
}

export async function addPaymentTx(
  id: string,
  input: Omit<PaymentRecord, 'id' | 'recordedBy'>,
  by: string,
): Promise<{ suggestedStatus: ApplicationStatus | null }> {
  return runTransaction(db, async (tx) => {
    const ref = doc(col(), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');
    const app = fromApplicationDoc(snap.id, snap.data());
    const payment: PaymentRecord = { ...input, id: crypto.randomUUID(), recordedBy: by };
    const { payments, paidTotal, suggestedStatus } = applyPayment(app, payment);
    tx.update(ref, { payments: payments.map(stripUndefinedPayment), paidTotal, updatedAt: serverTimestamp() });
    return { suggestedStatus };
  });
}

async function applyPlanTx(id: string, plan: (live: ApplicationRecord) => TxPlan): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(col(), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');
    const result = plan(fromApplicationDoc(snap.id, snap.data()));
    if ('conflict' in result) throw new Error('conflict');
    if ('error' in result) throw new Error(result.error);
    tx.update(ref, { ...result.fields, updatedAt: serverTimestamp() });
  });
}

/** 참가자 저장: 최신 문서에 바꾼 필드만 병합하고 (동시 수정/인원 변경이면 Error('conflict')), 가격은 싱글룸 요금만 갱신한다. */
export async function saveTravelersTx(id: string, baseCounts: Counts, baseTravelers: Traveler[], draftTravelers: Traveler[], config: TourConfig | null): Promise<void> {
  await applyPlanTx(id, (live) => planTravelersSave(live, baseCounts, baseTravelers, draftTravelers, config));
}

/** 인원 변경: 편집 시작 때의 인원과 다르면 Error('conflict'). */
export async function applyCountsTx(id: string, baseCounts: Counts, newCounts: Counts, config: TourConfig | null): Promise<void> {
  await applyPlanTx(id, (live) => planCountsApply(live, baseCounts, newCounts, config));
}

export const isConflictError = (e: unknown) => e instanceof Error && e.message === 'conflict';

export async function removePaymentTx(id: string, paymentId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(col(), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');
    const { payments, paidTotal } = withoutPayment(fromApplicationDoc(snap.id, snap.data()), paymentId);
    tx.update(ref, { payments: payments.map(stripUndefinedPayment), paidTotal, updatedAt: serverTimestamp() });
  });
}

function stripUndefinedPayment(p: PaymentRecord): Record<string, unknown> {
  const { reference, ...rest } = p;
  return reference ? { ...rest, reference } : rest;
}
