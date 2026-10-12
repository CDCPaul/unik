import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/site/Section';

export const metadata: Metadata = { title: 'Application received', robots: { index: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ app?: string; status?: string; duplicate?: string }> }) {
  const { app, status, duplicate } = await searchParams;
  const appNo = app && /^APP-\d{4,}$/.test(app) ? app : null;
  const waitlist = status === 'waitlist';
  return (
    <Section width="narrow" className="flex flex-col gap-6">
      <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink">
        {waitlist ? "You're on the waitlist" : 'Application received'}
      </h1>
      {appNo && duplicate === '1' ? <p className="text-lg font-bold text-brand-ink">We already received this application.</p> : null}
      {appNo ? (
        <p className="text-lg">
          Your application number is <b className="text-brand-ink">{appNo}</b>. We also sent a confirmation to your email.
        </p>
      ) : null}
      <p className="text-lg">
        {waitlist
          ? 'All available slots are currently taken. We will contact you as soon as a slot opens.'
          : 'Our team will contact you within 1 to 2 business days to confirm your slot and send payment instructions. No payment is needed yet.'}
      </p>
      <p>
        Questions? <Link href="/contact" className="font-bold text-brand-red">Contact us</Link> and mention your application number.
      </p>
      <p><Link href="/" className="font-bold text-brand-red">← Back to the tour</Link></p>
    </Section>
  );
}
