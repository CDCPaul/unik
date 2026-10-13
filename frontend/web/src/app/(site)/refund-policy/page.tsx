import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = { alternates: { canonical: '/refund-policy' }, title: LEGAL.refund.title };

export default function RefundPolicyPage() {
  return <LegalPage doc={LEGAL.refund} />;
}
