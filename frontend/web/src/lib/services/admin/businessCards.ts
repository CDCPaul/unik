import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { BusinessCard } from '@unik/shared/types';

/**
 * 어드민 명함 CRUD.
 * - 문서 ID = slug (URL 안정성을 위해 slug 가 곧 키)
 * - slug 가 바뀌면 새 문서를 만들고 기존 문서를 삭제하는 식으로 처리(rename 함수 제공)
 */

const COLLECTION = COLLECTIONS.businessCards;

export type BusinessCardInput = Omit<BusinessCard, 'id' | 'createdAt' | 'updatedAt'>;

/** slug 유효성 — 영문 소문자, 숫자, 하이픈만. 길이 2~40. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug);
}

function fromDoc(id: string, data: Record<string, unknown>): BusinessCard {
  const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return {
    id,
    slug: id,
    name: (data.name as string) ?? '',
    nameEn: data.nameEn as string | undefined,
    familyName: data.familyName as string | undefined,
    givenName: data.givenName as string | undefined,
    department: data.department as string | undefined,
    title: data.title as string | undefined,
    phone: (data.phone as string) ?? '',
    email: (data.email as string) ?? '',
    photoUrl: data.photoUrl as string | undefined,
    isActive: (data.isActive as boolean) ?? true,
    order: (data.order as number) ?? 0,
    createdAt,
    updatedAt,
  };
}

export async function listBusinessCards(): Promise<BusinessCard[]> {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function getBusinessCard(slug: string): Promise<BusinessCard | null> {
  const snap = await getDoc(doc(db, COLLECTION, slug));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

/** slug 가 비어있거나 중복이면 throw. */
export async function createBusinessCard(input: BusinessCardInput): Promise<void> {
  if (!isValidSlug(input.slug)) {
    throw new Error('Invalid slug. Use lowercase letters, numbers, hyphens (2-40 chars).');
  }
  const ref = doc(db, COLLECTION, input.slug);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`Slug "${input.slug}" already exists.`);
  }
  // undefined 값은 Firestore가 거부하므로 sanitize
  const sanitized = stripUndefined({ ...input });
  await setDoc(ref, {
    ...sanitized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBusinessCard(
  slug: string,
  patch: Partial<BusinessCardInput>,
): Promise<void> {
  const sanitized = stripUndefined({ ...patch });
  await updateDoc(doc(db, COLLECTION, slug), {
    ...sanitized,
    updatedAt: serverTimestamp(),
  });
}

/** slug 변경 — 기존 문서를 새 ID 로 복사 후 삭제. 사진 URL 은 그대로 유지. */
export async function renameBusinessCardSlug(oldSlug: string, newSlug: string): Promise<void> {
  if (oldSlug === newSlug) return;
  if (!isValidSlug(newSlug)) {
    throw new Error('Invalid new slug.');
  }
  const oldRef = doc(db, COLLECTION, oldSlug);
  const newRef = doc(db, COLLECTION, newSlug);
  const [oldSnap, newSnap] = await Promise.all([getDoc(oldRef), getDoc(newRef)]);
  if (!oldSnap.exists()) throw new Error('Source business card not found.');
  if (newSnap.exists()) throw new Error(`Slug "${newSlug}" already exists.`);
  await setDoc(newRef, {
    ...oldSnap.data(),
    updatedAt: serverTimestamp(),
  });
  await deleteDoc(oldRef);
}

export async function deleteBusinessCard(slug: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, slug));
}

/** 사진 업로드. slug 기준 폴더에 저장. */
export async function uploadBusinessCardPhoto(file: File, slug: string): Promise<string> {
  const safeSlug = slug || 'unsorted';
  const path = `business-cards/${safeSlug}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteBusinessCardPhoto(photoUrl: string): Promise<void> {
  try {
    await deleteObject(ref(storage, photoUrl));
  } catch (error) {
    console.warn('Failed to delete photo (may already be gone):', error);
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
