import { EMAIL_PATTERN, isValidBirthDate } from '@unik/shared/domain';
import type { Departure, TourConfig } from '@unik/shared/domain';

export const DEPARTURE_ID_PATTERN = /^[a-z0-9-]{2,20}$/;
// 출발·귀국일: 실존하는 달력 날짜만 (상한은 사실상 없음)
const DATE_MAX = '2100-12-31';
const isDate = (v: string) => isValidBirthDate(v, DATE_MAX);
const isMoney = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0;

export function defaultTourConfig(): TourConfig {
  return {
    acceptingApplications: false,
    currency: 'PHP',
    depositPerPax: 0,
    bibQuota: { total: 200 },
    mayaPaymentLinkBase: null,
    notifyEmails: [],
    departures: [],
  };
}

export function newDeparture(): Departure {
  return {
    id: '',
    label: '',
    departDate: '',
    returnDate: '',
    flightInfo: '',
    seatCapacity: 0,
    isOpen: true,
    prices: { full: 0, tenK: 0, companion: 0 },
    singleSupplement: 0,
  };
}

export type DepartureUsage = Record<string, { seatsUsed: number; applications: number }>;

export function validateTourConfig(c: TourConfig, usage: DepartureUsage): { errors: Record<string, string>; warnings: string[] } {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  if (!isMoney(c.depositPerPax)) errors.depositPerPax = 'Whole pesos, 0 or more.';
  if (!isMoney(c.bibQuota.total)) errors['bibQuota.total'] = 'Whole number, 0 or more.';
  if (c.mayaPaymentLinkBase !== null && c.mayaPaymentLinkBase.trim() !== '' && !/^https:\/\/\S+$/.test(c.mayaPaymentLinkBase.trim())) {
    errors.mayaPaymentLinkBase = 'Must be an https:// link (e.g. https://mymaya.me/yourstore).';
  }
  if (c.notifyEmails.some((e) => !EMAIL_PATTERN.test(e.trim()))) errors.notifyEmails = 'One or more emails are invalid.';
  const seen = new Set<string>();
  const presentIds = new Set(c.departures.map((d) => d.id));
  // 신청이 있는 출발편은 삭제·ID 변경을 막는다 (기존 신청의 연결이 끊기지 않도록)
  const removedInUse = Object.keys(usage).filter((id) => (usage[id]?.applications ?? 0) > 0 && !presentIds.has(id));
  if (removedInUse.length > 0) {
    errors['departures.removed'] = `Departure(s) in use cannot be removed or renamed: ${removedInUse.join(', ')}. Close them instead.`;
  }
  c.departures.forEach((d, i) => {
    const p = `departures.${i}`;
    if (!DEPARTURE_ID_PATTERN.test(d.id) || seen.has(d.id)) errors[`${p}.id`] = 'Lowercase letters, numbers and hyphens (2–20), unique.';
    seen.add(d.id);
    if (!d.label.trim()) errors[`${p}.label`] = 'Required.';
    if (!isDate(d.departDate)) errors[`${p}.departDate`] = 'Use a real date, YYYY-MM-DD.';
    if (!isDate(d.returnDate) || (isDate(d.departDate) && d.returnDate < d.departDate)) errors[`${p}.returnDate`] = 'Use a real date, YYYY-MM-DD, on or after departure.';
    if (!isMoney(d.seatCapacity)) errors[`${p}.seatCapacity`] = 'Whole number, 0 or more.';
    for (const k of ['full', 'tenK', 'companion'] as const) {
      if (!isMoney(d.prices[k])) errors[`${p}.prices.${k}`] = 'Whole pesos, 0 or more.';
    }
    if (!isMoney(d.singleSupplement)) errors[`${p}.singleSupplement`] = 'Whole pesos, 0 or more.';
    const used = usage[d.id]?.seatsUsed ?? 0;
    if (isMoney(d.seatCapacity) && d.seatCapacity < used) {
      warnings.push(`${d.label || d.id}: capacity ${d.seatCapacity} is below the ${used} seats already taken. New applications will go to the waitlist.`);
    }
  });
  return { errors, warnings };
}

export function canRemoveDeparture(usage: DepartureUsage, id: string): boolean {
  return (usage[id]?.applications ?? 0) === 0;
}
