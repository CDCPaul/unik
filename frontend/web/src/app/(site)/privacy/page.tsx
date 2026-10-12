import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = { title: LEGAL.privacy.title };

export default function PrivacyPage() {
  return <LegalPage doc={LEGAL.privacy} />;
}
