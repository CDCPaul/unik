import { CATEGORY_LABELS } from '@unik/shared/domain';
import type { ApplicationRecord } from './applicationDoc';
import { STATUS_LABELS, formatManila } from './format';

type Cell = string | number | null | undefined;

function cell(v: Cell): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // 엑셀 수식 주입 방지
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** BOM 포함(엑셀 한글·특수문자), 행 구분 CRLF */
export function toCsv(rows: Cell[][]): string {
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

export function applicationsCsv(apps: ApplicationRecord[]): string {
  const header = ['App no', 'Status', 'Applied (Manila)', 'Departure', 'First name', 'Last name', 'Email', 'Phone', 'Viber', 'WhatsApp', 'Full', '10K', 'Companion', 'Child', 'Infant', 'Promo code', 'Agency', 'Total PHP', 'Deposit due PHP', 'Paid PHP', 'Info', 'Special requests', 'Staff notes'];
  const rows = apps.map((a) => [
    a.appNo,
    STATUS_LABELS[a.status],
    formatManila(a.createdAt),
    a.departure.label,
    a.lead.firstName,
    a.lead.lastName,
    a.lead.email,
    `${a.lead.phoneDial} ${a.lead.phoneNumber}`,
    yesNo(a.lead.viber),
    yesNo(a.lead.whatsapp),
    a.counts.full,
    a.counts.tenK,
    a.counts.companion,
    a.counts.child,
    a.counts.infant,
    a.pricing.promo?.code ?? '',
    a.pricing.promo?.agencyName ?? '',
    a.pricing.total,
    a.pricing.depositDue,
    a.paidTotal,
    `${a.completeness.filled}/${a.completeness.total}`,
    a.specialRequests ?? '',
    a.staffNotes ?? '',
  ]);
  return toCsv([header, ...rows]);
}

export function travelersCsv(apps: ApplicationRecord[]): string {
  const header = ['App no', 'Status', 'Departure', 'Traveler', 'Category', 'Name as in passport', 'Date of birth', 'Gender', 'Nationality', 'T-shirt', 'Expected finish', 'Recent marathon', 'Room', 'Emergency contact', 'Lead email'];
  const rows = apps
    .filter((a) => a.status !== 'cancelled')
    .flatMap((a) =>
      a.travelers.map((t, i) => [
        a.appNo,
        STATUS_LABELS[a.status],
        a.departure.label,
        i + 1,
        CATEGORY_LABELS[t.category],
        t.passportName,
        t.dob,
        t.gender,
        t.nationality,
        t.tshirtSize,
        t.expectedFinish,
        t.recentMarathon,
        t.room,
        t.emergencyContact,
        a.lead.email,
      ]),
    );
  return toCsv([header, ...rows]);
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // 일부 브라우저(특히 Firefox)는 DOM에 붙어 있지 않은 링크의 클릭을 무시한다
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 다운로드가 시작되기 전에 URL을 해제하면 실패할 수 있어 지연한다
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
