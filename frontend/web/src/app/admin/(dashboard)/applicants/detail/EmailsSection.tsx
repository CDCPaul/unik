'use client';

import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { Section } from './ui';

function Row({ label, state, error }: { label: string; state?: string; error?: string }) {
  if (!state && !error) return null;
  return (
    <li>
      {label}: <span className={state === 'failed' ? 'font-semibold text-red-600' : ''}>{state ?? 'unknown'}</span>
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </li>
  );
}

export function EmailsSection({ app }: { app: ApplicationRecord }) {
  const n = app.notifications;
  if (!n) return null;
  return (
    <Section title="Emails">
      <ul className="flex flex-col gap-1 text-sm text-slate-700">
        <Row label="Customer email" state={n.customerEmail} error={n.customerEmailError} />
        <Row label="Staff email" state={n.staffEmail} error={n.staffEmailError} />
      </ul>
    </Section>
  );
}
