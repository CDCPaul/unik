// 로컬 에뮬레이터용 투어 설정·프로모 코드 시드. 운영 프로젝트에는 절대 실행하지 않는다.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST is not set. Refusing to seed a real project.');
  process.exit(1);
}
initializeApp({ projectId: 'demo-unik' });
const db = getFirestore();

await db.doc('tourConfig/seoul2027').set({
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: ['staff@cebudirectclub.com'],
  departures: [
    { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: 'Sample flight info', seatCapacity: 120, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000, child: 60000, infant: 8000 }, singleSupplement: 15000 },
    { id: 'ceb', label: 'Cebu (CEB)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: 'Sample flight info', seatCapacity: 2, isOpen: true, prices: { full: 85000, tenK: 80000, companion: 75000, child: 65000, infant: 8000 }, singleSupplement: 15000 },
  ],
});
await db.doc('promoCodes/TA-SUNRISE').set({ agencyName: 'Sunrise Travel', discountType: 'fixed', discountValue: 2000, validUntil: null, maxPax: null, active: true });
console.log('Seeded tourConfig/seoul2027 and promoCodes/TA-SUNRISE');
