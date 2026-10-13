import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { PromoCode } from '@unik/shared/domain';

const col = () => collection(db, COLLECTIONS.promoCodes);

export function subscribePromoCodes(cb: (codes: PromoCode[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    col(),
    (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Omit<PromoCode, 'code'>), code: d.id })).sort((a, b) => a.code.localeCompare(b.code))),
    onError,
  );
}

export async function createPromoCode(code: string, data: Omit<PromoCode, 'code'>, by: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(col(), code);
    if ((await tx.get(ref)).exists()) throw new Error('exists');
    tx.set(ref, { ...data, createdAt: serverTimestamp(), createdBy: by });
  });
}

export async function updatePromoCode(code: string, data: Omit<PromoCode, 'code'>): Promise<void> {
  await updateDoc(doc(col(), code), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePromoCode(code: string): Promise<void> {
  await deleteDoc(doc(col(), code));
}
