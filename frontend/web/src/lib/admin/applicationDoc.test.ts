import { describe, expect, it } from 'vitest';
import { fromApplicationDoc } from './applicationDoc';

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

describe('fromApplicationDoc', () => {
  it('converts timestamps and fills safe defaults', () => {
    const r = fromApplicationDoc('doc1', {
      appNo: 'APP-0001',
      status: 'new',
      departure: { id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23' },
      lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
      counts: { full: 1, tenK: 0, companion: 0 },
      travelers: [{ category: 'full' }],
      completeness: { filled: 0, total: 8 },
      pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: null, total: 80000, depositDue: 10000 },
      payments: [{ id: 'p1', type: 'deposit', method: 'maya_qr', amount: 10000, paidAt: ts('2026-10-20T02:00:00Z'), recordedBy: 'a@cebudirectclub.com' }],
      paidTotal: 10000,
      statusHistory: [{ status: 'new', at: ts('2026-10-19T02:00:00Z'), by: 'system' }],
      createdAt: ts('2026-10-19T02:00:00Z'),
    });
    expect(r.id).toBe('doc1');
    expect(r.payments[0].paidAt).toEqual(new Date('2026-10-20T02:00:00Z'));
    expect(r.statusHistory[0].at).toEqual(new Date('2026-10-19T02:00:00Z'));
    expect(r.createdAt).toEqual(new Date('2026-10-19T02:00:00Z'));
    expect(r.specialRequests).toBeNull();
    expect(r.staffNotes).toBeNull();
    expect(r.notifications).toBeNull();
  });
  it('tolerates a document still missing server timestamps', () => {
    const r = fromApplicationDoc('doc2', { appNo: 'APP-0002', status: 'waitlist' });
    expect(r.createdAt).toBeNull();
    expect(r.payments).toEqual([]);
    expect(r.counts).toEqual({ full: 0, tenK: 0, companion: 0 });
    expect(r.travelers).toEqual([]);
  });
  it('reads voided payment fields and leaves normal payments without them', () => {
    const r = fromApplicationDoc('doc3', {
      payments: [
        { id: 'p1', type: 'deposit', method: 'cash', amount: 1000, paidAt: ts('2026-10-20T02:00:00Z'), recordedBy: 'a@x.co', voidedAt: ts('2026-10-21T02:00:00Z'), voidedBy: 'b@x.co' },
        { id: 'p2', type: 'balance', method: 'cash', amount: 2000, paidAt: ts('2026-10-20T02:00:00Z'), recordedBy: 'a@x.co' },
      ],
    });
    expect(r.payments[0]).toMatchObject({ voidedAt: new Date('2026-10-21T02:00:00Z'), voidedBy: 'b@x.co' });
    expect('voidedAt' in r.payments[1]).toBe(false);
  });
});
