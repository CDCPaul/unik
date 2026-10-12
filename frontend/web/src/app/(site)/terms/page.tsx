import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = { title: LEGAL.terms.title };

export default function TermsPage() {
  return <LegalPage doc={LEGAL.terms} />;
}
