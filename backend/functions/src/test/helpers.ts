import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { PromoCode, TourConfig } from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';

export function testDb(): Firestore {
  return getFirestore();
}

export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const res = await fetch(`http://${host}/emulator/v1/projects/demo-unik/databases/(default)/documents`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`clearFirestore failed: ${res.status}`);
}

export const baseConfig: TourConfig = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: ['staff@cebudirectclub.com'],
  departures: [
    {
      id: 'mnl',
      label: 'Manila (MNL)',
      departDate: '2027-03-19',
      returnDate: '2027-03-23',
      flightInfo: 'TBA',
      seatCapacity: 120,
      isOpen: true,
      prices: { full: 80000, tenK: 75000, companion: 70000 },
      singleSupplement: 15000,
    },
    {
      id: 'ceb',
      label: 'Cebu (CEB)',
      departDate: '2027-03-19',
      returnDate: '2027-03-23',
      flightInfo: 'TBA',
      seatCapacity: 80,
      isOpen: true,
      prices: { full: 85000, tenK: 80000, companion: 75000 },
      singleSupplement: 15000,
    },
  ],
};

export async function seedTourConfig(over: Partial<TourConfig> = {}): Promise<void> {
  await testDb().collection(COL.tourConfig).doc(TOUR_ID).set({ ...baseConfig, ...over });
}

export async function seedPromo(code: string, over: Partial<Omit<PromoCode, 'code'>> = {}): Promise<void> {
  await testDb()
    .collection(COL.promoCodes)
    .doc(code)
    .set({
      agencyName: 'Sunrise Travel',
      discountType: 'fixed',
      discountValue: 2000,
      validUntil: null,
      maxPax: null,
      active: true,
      ...over,
    });
}
