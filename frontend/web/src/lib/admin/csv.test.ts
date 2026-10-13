import { afterEach, describe, expect, it, vi } from 'vitest';
import { applicationsCsv, downloadCsv, toCsv, travelersCsv } from './csv';
import type { ApplicationRecord } from './applicationDoc';

const base: ApplicationRecord = {
  id: 'a1',
  appNo: 'APP-0001',
  status: 'contacted',
  departure: { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' },
  lead: { firstName: 'Maria', lastName: 'Santos, Jr.', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
  counts: { full: 1, tenK: 0, companion: 1, child: 0, infant: 0 },
  travelers: [
    { category: 'full', passportName: '=HYPERLINK("x")', dob: '1990-05-14', tshirtSize: 'M' },
    { category: 'companion', passportName: 'He said "hi"\nbye' },
  ],
  completeness: { filled: 4, total: 14 },
  pricing: { lines: [], singleSupplements: 0, subtotal: 150000, promo: { code: 'TA-A', agencyName: 'A Travel', type: 'fixed', value: 2000, discountTotal: 4000 }, total: 146000, depositDue: 20000 },
  payments: [],
  paidTotal: 20000,
  specialRequests: 'Vegetarian',
  staffNotes: null,
  statusHistory: [],
  createdAt: new Date('2026-10-19T16:30:00Z'),
  notifications: null,
};

describe('toCsv', () => {
  it('escapes and neutralizes formulas', () => {
    const csv = toCsv([['a,b', 'say "x"', 'line1\nline2', '=SUM(A1)', '+1', '-2', '@x', 5, null]]);
    expect(csv).toBe('﻿"a,b","say ""x""","line1\nline2",\'=SUM(A1),\'+1,\'-2,\'@x,5,\r\n');
  });
});

describe('applicationsCsv', () => {
  it('has one row per application with Manila time and promo agency', () => {
    const lines = applicationsCsv([base]).replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe(
      'App no,Status,Applied (Manila),Departure,First name,Last name,Email,Phone,Viber,WhatsApp,Full,10K,Companion,Child,Infant,Promo code,Agency,Total PHP,Deposit due PHP,Paid PHP,Info,Special requests,Staff notes',
    );
    expect(lines[1]).toBe(
      // 전화번호는 '+' 로 시작하므로 수식 방지 접두사 ' 가 붙는다(엑셀에서 텍스트로 표시)
      "APP-0001,Contacted,2026-10-20 00:30,Manila (MNL),Maria,\"Santos, Jr.\",maria@example.com,'+63 917 123 4567,Yes,No,1,0,1,0,0,TA-A,A Travel,146000,20000,20000,4/14,Vegetarian,",
    );
  });
});

describe('child / infant columns', () => {
  it('exports child and infant counts and traveler categories', () => {
    const family: ApplicationRecord = {
      ...base,
      lead: { ...base.lead, lastName: 'Santos' }, // 쉼표 없는 셀만 두어 split(',') 로 열을 찾는다
      counts: { full: 1, tenK: 0, companion: 0, child: 2, infant: 1 },
      travelers: [{ category: 'full' }, { category: 'child' }, { category: 'child' }, { category: 'infant' }],
    };
    const [headerLine, rowLine] = applicationsCsv([family]).replace('﻿', '').trim().split('\r\n');
    const header = headerLine.split(',');
    const row = rowLine.split(',');
    expect(row[header.indexOf('Child')]).toBe('2');
    expect(row[header.indexOf('Infant')]).toBe('1');
    const travelers = travelersCsv([family]).replace('﻿', '').trim().split('\r\n');
    expect(travelers.slice(1).map((l) => l.split(',')[4])).toEqual(['Full Marathon', 'Child (under 12)', 'Child (under 12)', 'Infant (under 2)']);
  });
});

describe('travelersCsv', () => {
  it('has one row per traveler and skips cancelled applications', () => {
    const lines = travelersCsv([base, { ...base, id: 'a2', appNo: 'APP-0002', status: 'cancelled' }])
      .replace('﻿', '')
      .trim()
      .split('\r\n');
    expect(lines[0]).toBe(
      'App no,Status,Departure,Traveler,Category,Name as in passport,Date of birth,Gender,Nationality,T-shirt,Expected finish,Recent marathon,Room,Emergency contact,Lead email',
    );
    // header + 2 travelers; the cancelled application is skipped. 셀 안 줄바꿈(\n)은 행 구분자(\r\n)가 아니다.
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("'=HYPERLINK(\"\"x\"\")");
  });
});

describe('downloadCsv', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it('attaches the link while clicking, removes it, and revokes the URL after a delay', () => {
    vi.useFakeTimers();
    const order: string[] = [];
    const anchor = {
      href: '',
      download: '',
      click: vi.fn(() => order.push('click')),
      remove: vi.fn(() => order.push('remove')),
    };
    const body = { appendChild: vi.fn(() => order.push('append')) };
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor), body });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    downloadCsv('applications.csv', 'a,b');

    expect(anchor.download).toBe('applications.csv');
    expect(order).toEqual(['append', 'click', 'remove']);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revoke).toHaveBeenCalledWith('blob:csv');
  });
});
