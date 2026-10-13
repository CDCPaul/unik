import { isValidBirthDate, isValidPromoCodeFormat, normalizePromoCode } from '@unik/shared/domain';
import type { DiscountType, PromoCode } from '@unik/shared/domain';
import { parseAmount } from './edits';

export interface PromoForm {
  code: string;
  agencyName: string;
  contactName: string;
  contactInfo: string;
  discountType: DiscountType;
  discountValue: string;
  validUntil: string;
  maxPax: string;
  active: boolean;
  notes: string;
}

export function emptyPromoForm(): PromoForm {
  return { code: '', agencyName: '', contactName: '', contactInfo: '', discountType: 'fixed', discountValue: '', validUntil: '', maxPax: '', active: true, notes: '' };
}

export function promoToForm(p: PromoCode): PromoForm {
  return {
    code: p.code,
    agencyName: p.agencyName,
    contactName: p.contactName ?? '',
    contactInfo: p.contactInfo ?? '',
    discountType: p.discountType,
    discountValue: String(p.discountValue),
    validUntil: p.validUntil ?? '',
    maxPax: p.maxPax === null ? '' : String(p.maxPax),
    active: p.active,
    notes: p.notes ?? '',
  };
}

function discountNumber(f: PromoForm): number | null {
  const raw = f.discountValue.trim();
  if (raw === '0' && f.discountType === 'fixed') return 0;
  return parseAmount(raw);
}

export function validatePromoForm(f: PromoForm, opts: { isNew: boolean; existingCodes: string[] }): Record<string, string> {
  const e: Record<string, string> = {};
  const code = normalizePromoCode(f.code);
  if (opts.isNew) {
    if (!isValidPromoCodeFormat(code)) e.code = 'Use A–Z, 0–9 and hyphens (3–20 characters).';
    else if (opts.existingCodes.includes(code)) e.code = 'This code already exists.';
  }
  if (!f.agencyName.trim() || f.agencyName.trim().length > 100) e.agencyName = 'Required (max 100 characters).';
  const v = discountNumber(f);
  if (f.discountType === 'percent') {
    if (v === null || v < 1 || v > 100) e.discountValue = 'Whole percent from 1 to 100.';
  } else if (v === null || v > 1_000_000) {
    e.discountValue = 'Whole pesos from 0 to 1,000,000.';
  }
  // 날짜 유효성은 생년월일 검증기를 재사용(형식·실존 날짜), 범위는 넉넉히
  if (f.validUntil.trim() && !isValidBirthDate(f.validUntil.trim(), '2100-12-31')) e.validUntil = 'Use a real date (YYYY-MM-DD).';
  if (f.maxPax.trim()) {
    const n = parseAmount(f.maxPax);
    if (n === null) e.maxPax = 'Whole number, 1 or more.';
  }
  return e;
}

export function toPromoDoc(f: PromoForm): Omit<PromoCode, 'code'> {
  return {
    agencyName: f.agencyName.trim(),
    contactName: f.contactName.trim(),
    contactInfo: f.contactInfo.trim(),
    discountType: f.discountType,
    discountValue: discountNumber(f) ?? 0,
    validUntil: f.validUntil.trim() || null,
    maxPax: f.maxPax.trim() ? parseAmount(f.maxPax) : null,
    active: f.active,
    notes: f.notes.trim(),
  };
}

export function referralLink(code: string): string {
  return `https://unik.ph/apply?code=${encodeURIComponent(code)}`;
}

/** validUntil(YYYY-MM-DD)이 마닐라 오늘보다 이전이면 만료. 활성(active)이어도 만료일 수 있다. */
export function isPromoExpired(validUntil: string | null | undefined, manilaToday: string): boolean {
  return !!validUntil && validUntil < manilaToday;
}
