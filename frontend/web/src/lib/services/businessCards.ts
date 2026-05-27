import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { BusinessCard } from '@unik/shared/types';

/**
 * 공개(읽기 전용) 명함 서비스.
 * Firestore 규칙에 따라 인증 없이 호출 가능. 비활성화된 카드는 null 처리한다.
 */

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

/** slug(===document ID)로 단건 조회. 없거나 비활성화면 null. */
export async function getBusinessCardBySlug(slug: string): Promise<BusinessCard | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.businessCards, slug));
    if (!snap.exists()) return null;
    const card = fromDoc(snap.id, snap.data());
    if (!card.isActive) return null;
    return card;
  } catch (error) {
    console.error('Error fetching business card:', error);
    return null;
  }
}

/** 활성 명함 전체 (랜딩/디렉토리 용 — 현재는 안 쓰지만 추후 확장 대비) */
export async function getActiveBusinessCards(): Promise<BusinessCard[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.businessCards),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromDoc(d.id, d.data()));
  } catch (error) {
    console.error('Error listing business cards:', error);
    return [];
  }
}
