// 로컬 에뮬레이터용 샘플 신청서 4건. seed-emulator.mjs(tourConfig·TA-SUNRISE) 실행 뒤에 돌린다.
// 운영 프로젝트에는 절대 실행하지 않는다. 문서 모양은 src/applications/submit.ts 가 쓰는 것과 같다.
// pricing 은 shared/domain 의 computePricing 과 같은 숫자로 직접 적었다(seed-emulator.mjs 의 tourConfig 기준).
// counters/seoul2027 은 건드리지 않는다.
// APP-9001~9003 은 아동·유아 도입 이전 모양(counts 에 child/infant 키 없음)으로 두어 하위 호환을 확인한다.
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST is not set. Refusing to seed a real project.');
  process.exit(1);
}
initializeApp({ projectId: 'demo-unik' });
const db = getFirestore();

const MNL = { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' };
const CEB = { id: 'ceb', label: 'Cebu (CEB)', departDate: '2027-03-19', returnDate: '2027-03-23' };

const RUNNER_FIELDS = ['passportName', 'dob', 'gender', 'nationality', 'tshirtSize', 'expectedFinish', 'room', 'emergencyContact'];
const COMPANION_FIELDS = ['passportName', 'dob', 'gender', 'nationality', 'room', 'emergencyContact'];
const INFANT_FIELDS = ['passportName', 'dob', 'gender', 'nationality', 'emergencyContact'];
function completeness(travelers) {
  let filled = 0;
  let total = 0;
  for (const t of travelers) {
    const fields = t.category === 'full' || t.category === 'tenK' ? RUNNER_FIELDS : t.category === 'infant' ? INFANT_FIELDS : COMPANION_FIELDS;
    total += fields.length;
    filled += fields.filter((f) => typeof t[f] === 'string' && t[f].trim() !== '').length;
  }
  return { filled, total };
}

function build({ id, appNo, status, departure, lead, counts, travelers, pricing, history }) {
  const at = Timestamp.now();
  return {
    appNo,
    status,
    departure,
    lead,
    counts,
    travelers,
    completeness: completeness(travelers),
    pricing,
    payments: [],
    paidTotal: 0,
    specialRequests: null,
    staffNotes: null,
    statusHistory: history.map((h) => ({ ...h, at: Timestamp.now() })),
    idempotencyKey: id,
    agreedToTermsAt: at,
    createdAt: at,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

const apps = [
  {
    // MNL: full 2 (80,000) + companion 1 (70,000) = 230,000, single x1 (15,000), TA-SUNRISE fixed 2,000 x 3 pax
    id: '9f1c2a10-0001-4a00-8000-000000009001',
    appNo: 'APP-9001',
    status: 'new',
    departure: MNL,
    lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@example.com', phoneDial: '+63', phoneNumber: '9171234567', viber: true, whatsapp: false },
    counts: { full: 2, tenK: 0, companion: 1 },
    travelers: [
      { category: 'full', passportName: 'SANTOS MARIA', dob: '1985-04-12', gender: 'female', nationality: 'Filipino', tshirtSize: 'M', expectedFinish: '4:30', room: 'single', emergencyContact: 'Juan Santos +63 917 000 0001' },
      { category: 'full', passportName: 'SANTOS PEDRO', dob: '1983-09-30', gender: 'male', nationality: 'Filipino', room: 'twin' },
      { category: 'companion', passportName: 'SANTOS ANA', room: 'twin' },
    ],
    pricing: {
      lines: [
        { category: 'full', qty: 2, unitPrice: 80000, amount: 160000 },
        { category: 'companion', qty: 1, unitPrice: 70000, amount: 70000 },
      ],
      singleSupplements: 15000,
      subtotal: 245000,
      promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 },
      total: 239000,
      depositDue: 30000,
    },
    history: [{ status: 'new', by: 'system' }],
  },
  {
    // CEB: tenK 1 (80,000), no promo
    id: '9f1c2a10-0002-4a00-8000-000000009002',
    appNo: 'APP-9002',
    status: 'contacted',
    departure: CEB,
    lead: { firstName: 'Jose', lastName: 'Reyes', email: 'jose.reyes@example.com', phoneDial: '+63', phoneNumber: '9189876543', viber: false, whatsapp: true },
    counts: { full: 0, tenK: 1, companion: 0 },
    travelers: [
      { category: 'tenK', passportName: 'REYES JOSE', dob: '1990-01-20', gender: 'male', nationality: 'Filipino', tshirtSize: 'L', expectedFinish: '0:55', room: 'twin', emergencyContact: 'Rosa Reyes +63 918 000 0002' },
    ],
    pricing: {
      lines: [{ category: 'tenK', qty: 1, unitPrice: 80000, amount: 80000 }],
      singleSupplements: 0,
      subtotal: 80000,
      promo: null,
      total: 80000,
      depositDue: 10000,
    },
    history: [
      { status: 'new', by: 'system' },
      { status: 'contacted', by: 'staff@cebudirectclub.com' },
    ],
  },
  {
    // MNL: full 1 (80,000), cancelled
    id: '9f1c2a10-0003-4a00-8000-000000009003',
    appNo: 'APP-9003',
    status: 'cancelled',
    departure: MNL,
    lead: { firstName: 'Liza', lastName: 'Cruz', email: 'liza.cruz@example.com', phoneDial: '+63', phoneNumber: '9175550123', viber: false, whatsapp: false },
    counts: { full: 1, tenK: 0, companion: 0 },
    travelers: [{ category: 'full' }],
    pricing: {
      lines: [{ category: 'full', qty: 1, unitPrice: 80000, amount: 80000 }],
      singleSupplements: 0,
      subtotal: 80000,
      promo: null,
      total: 80000,
      depositDue: 10000,
    },
    history: [
      { status: 'new', by: 'system' },
      { status: 'cancelled', by: 'staff@cebudirectclub.com' },
    ],
  },
  {
    // MNL 가족: full 1 (80,000) + companion 1 (70,000) + child 1 (60,000) + infant 1 (8,000) = 218,000
    // TA-SUNRISE fixed 2,000 x 3 pax (유아 제외) = 6,000, 예약금 10,000 x 3 + 유아 8,000 (단가까지만) = 38,000
    id: '9f1c2a10-0004-4a00-8000-000000009004',
    appNo: 'APP-9004',
    status: 'new',
    departure: MNL,
    lead: { firstName: 'Carmen', lastName: 'Lim', email: 'carmen.lim@example.com', phoneDial: '+63', phoneNumber: '9171112233', viber: true, whatsapp: true },
    counts: { full: 1, tenK: 0, companion: 1, child: 1, infant: 1 },
    travelers: [
      { category: 'full', passportName: 'LIM CARMEN', dob: '1988-02-03', gender: 'female', nationality: 'Filipino', tshirtSize: 'S', room: 'twin' },
      { category: 'companion', passportName: 'LIM DAVID', room: 'twin' },
      { category: 'child', passportName: 'LIM SOFIA', dob: '2018-06-10', gender: 'female', room: 'twin' },
      { category: 'infant', passportName: 'LIM MATEO', dob: '2026-01-15', gender: 'male' },
    ],
    pricing: {
      lines: [
        { category: 'full', qty: 1, unitPrice: 80000, amount: 80000 },
        { category: 'companion', qty: 1, unitPrice: 70000, amount: 70000 },
        { category: 'child', qty: 1, unitPrice: 60000, amount: 60000 },
        { category: 'infant', qty: 1, unitPrice: 8000, amount: 8000 },
      ],
      singleSupplements: 0,
      subtotal: 218000,
      promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 },
      total: 212000,
      depositDue: 38000,
    },
    history: [{ status: 'new', by: 'system' }],
  },
];

for (const app of apps) {
  await db.collection('applications').doc(app.id).set(build(app));
}
console.log(`Seeded ${apps.length} applications: ${apps.map((a) => a.appNo).join(', ')}`);
