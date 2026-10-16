'use client';

import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { MessageKey } from '@/lib/admin/i18n/translate';
import { Section } from './ui';

// Cloud Functions 가 남기는 발송 상태값. 모르는 값은 그대로 보여준다.
const STATE_KEYS: Record<string, MessageKey> = {
  sent: 'detail.emails.state.sent',
  skipped: 'detail.emails.state.skipped',
  failed: 'detail.emails.state.failed',
};

function Row({ label, state, error }: { label: string; state?: string; error?: string }) {
  const { t } = useAdminT();
  if (!state && !error) return null;
  const stateText = state === undefined ? t('detail.emails.state.unknown') : STATE_KEYS[state] ? t(STATE_KEYS[state]) : state;
  return (
    <li>
      {label}: <span className={state === 'failed' ? 'font-semibold text-red-600' : ''}>{stateText}</span>
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </li>
  );
}

export function EmailsSection({ app }: { app: ApplicationRecord }) {
  const { t } = useAdminT();
  const n = app.notifications;
  if (!n) return null;
  return (
    <Section title={t('detail.emails.title')}>
      <ul className="flex flex-col gap-1 text-sm text-slate-700">
        <Row label={t('detail.emails.customer')} state={n.customerEmail} error={n.customerEmailError} />
        <Row label={t('detail.emails.staff')} state={n.staffEmail} error={n.staffEmailError} />
      </ul>
    </Section>
  );
}
