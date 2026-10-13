import type { ApplicationStatus } from '@unik/shared/domain';

export function formatManila(date: Date | null): string {
  if (!date) return '—';
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  deposit_paid: 'Deposit paid',
  fully_paid: 'Fully paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  waitlist: 'Waitlist',
};

export const STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-sky-100 text-sky-800',
  fully_paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-slate-900 text-white',
  cancelled: 'bg-slate-100 text-slate-500',
  waitlist: 'bg-purple-100 text-purple-800',
};
