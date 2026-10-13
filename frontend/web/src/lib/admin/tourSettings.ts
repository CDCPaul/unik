import { EMAIL_PATTERN } from '@unik/shared/domain';
import type { Departure, TourConfig } from '@unik/shared/domain';

export const DEPARTURE_ID_PATTERN = /^[a-z0-9-]{2,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
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
  c.departures.forEach((d, i) => {
    const p = `departures.${i}`;
    if (!DEPARTURE_ID_PATTERN.test(d.id) || seen.has(d.id)) errors[`${p}.id`] = 'Lowercase letters, numbers and hyphens (2–20), unique.';
    seen.add(d.id);
    if (!d.label.trim()) errors[`${p}.label`] = 'Required.';
    if (!DATE.test(d.departDate)) errors[`${p}.departDate`] = 'YYYY-MM-DD.';
    if (!DATE.test(d.returnDate) || (DATE.test(d.departDate) && d.returnDate < d.departDate)) errors[`${p}.returnDate`] = 'YYYY-MM-DD, on or after departure.';
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
