import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-unik',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

const anon = () => env.unauthenticatedContext().firestore();
const staff = () =>
  env.authenticatedContext('staff', { email: 'staff@cebudirectclub.com', email_verified: true }).firestore();
const outsider = () =>
  env.authenticatedContext('outsider', { email: 'someone@gmail.com', email_verified: true }).firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

describe('tourConfig / availability (public read)', () => {
  it('anyone can read, only staff can write tourConfig', async () => {
    await seed('tourConfig/seoul2027', { acceptingApplications: true });
    await assertSucceeds(getDoc(doc(anon(), 'tourConfig/seoul2027')));
    await assertFails(setDoc(doc(anon(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
    await assertFails(setDoc(doc(outsider(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
    await assertSucceeds(setDoc(doc(staff(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
  });
  it('anyone can read availability, non-staff cannot write it', async () => {
    await seed('availability/seoul2027', { bibsUsed: 0 });
    await assertSucceeds(getDoc(doc(anon(), 'availability/seoul2027')));
    await assertFails(setDoc(doc(anon(), 'availability/seoul2027'), { bibsUsed: 999 }));
    await assertFails(setDoc(doc(outsider(), 'availability/seoul2027'), { bibsUsed: 999 }));
  });
});

describe('applications (server-created)', () => {
  it('public cannot create, read or list applications', async () => {
    await seed('applications/a1', { appNo: 'APP-0001' });
    await assertFails(setDoc(doc(anon(), 'applications/a2'), { appNo: 'APP-9999' }));
    await assertFails(getDoc(doc(anon(), 'applications/a1')));
    await assertFails(getDoc(doc(outsider(), 'applications/a1')));
  });
  it('staff can read and update but not delete', async () => {
    await seed('applications/a1', { appNo: 'APP-0001', status: 'new' });
    await assertSucceeds(getDoc(doc(staff(), 'applications/a1')));
    await assertSucceeds(updateDoc(doc(staff(), 'applications/a1'), { status: 'contacted' }));
    await assertFails(deleteDoc(doc(staff(), 'applications/a1')));
  });
});

describe('promoCodes and counters', () => {
  it('promo codes are staff only', async () => {
    await seed('promoCodes/TA-SUNRISE', { active: true });
    await assertFails(getDoc(doc(anon(), 'promoCodes/TA-SUNRISE')));
    await assertFails(getDoc(doc(outsider(), 'promoCodes/TA-SUNRISE')));
    await assertSucceeds(getDoc(doc(staff(), 'promoCodes/TA-SUNRISE')));
    await assertSucceeds(setDoc(doc(staff(), 'promoCodes/TA-NEW'), { active: true }));
  });
  it('counters are never readable by the public', async () => {
    await seed('counters/seoul2027', { appSeq: 3 });
    await assertFails(getDoc(doc(anon(), 'counters/seoul2027')));
  });
});

describe('business_cards (must stay public read)', () => {
  it('anyone reads, only staff writes', async () => {
    await seed('business_cards/hong', { slug: 'hong', isActive: true });
    await assertSucceeds(getDoc(doc(anon(), 'business_cards/hong')));
    await assertFails(setDoc(doc(outsider(), 'business_cards/hong'), { slug: 'x' }));
    await assertSucceeds(setDoc(doc(staff(), 'business_cards/hong'), { slug: 'hong', isActive: false }));
  });
});

describe('contacts', () => {
  const valid = {
    name: 'Maria',
    email: 'maria@example.com',
    subject: 'Question',
    message: 'Hello',
    isRead: false,
  };
  it('public can create a well-formed inquiry', async () => {
    await assertSucceeds(addDoc(collection(anon(), 'contacts'), { ...valid, createdAt: serverTimestamp() }));
  });
  it('rejects unknown fields and oversized messages', async () => {
    await assertFails(addDoc(collection(anon(), 'contacts'), { ...valid, isRead: true, createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(anon(), 'contacts'), { ...valid, admin: true, createdAt: serverTimestamp() }));
    await assertFails(
      addDoc(collection(anon(), 'contacts'), { ...valid, message: 'x'.repeat(5001), createdAt: serverTimestamp() }),
    );
  });
  it('public cannot read inquiries', async () => {
    await seed('contacts/c1', valid);
    await assertFails(getDoc(doc(anon(), 'contacts/c1')));
  });
});

describe('legacy collections are locked to staff', () => {
  it('registrations and tours are no longer public', async () => {
    await seed('registrations/r1', { fullName: 'x' });
    await seed('tours/t1', { title: 'x' });
    await assertFails(setDoc(doc(anon(), 'registrations/r2'), { fullName: 'y' }));
    await assertFails(getDoc(doc(anon(), 'tours/t1')));
  });
});
