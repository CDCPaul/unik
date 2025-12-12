import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';

export interface UiTextDoc {
  values: Record<string, string>;
  fonts?: Record<string, 'inherit' | 'display' | 'sans-serif' | 'serif' | 'monospace' | 'korean-sans'>;
  updatedAt?: Date;
}

const UI_TEXT_DOC_ID = 'uiText';

export async function getUiText(): Promise<UiTextDoc> {
  const ref = doc(db, COLLECTIONS.settings, UI_TEXT_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { values: {} };
  const data = snap.data() as any;
  return {
    values: (data?.values || {}) as Record<string, string>,
    fonts: (data?.fonts || {}) as UiTextDoc['fonts'],
    updatedAt: data?.updatedAt?.toDate?.(),
  };
}

export async function saveUiText(
  values: Record<string, string>,
  fonts: Record<string, 'inherit' | 'display' | 'sans-serif' | 'serif' | 'monospace' | 'korean-sans'>
): Promise<void> {
  const ref = doc(db, COLLECTIONS.settings, UI_TEXT_DOC_ID);
  // strip undefined
  const payload = JSON.parse(JSON.stringify(values));
  const fontPayload = JSON.parse(JSON.stringify(fonts));
  await setDoc(
    ref,
    {
      values: payload,
      fonts: fontPayload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}


