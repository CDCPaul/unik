import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { SITE } from '@/content/site';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = { alternates: { canonical: '/contact' }, title: 'Contact', description: 'Questions about the Seoul Marathon 2027 tour? Contact CDC Travel.' };

export default function ContactPage() {
  return (
    <Section className="flex flex-wrap gap-12">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        <SectionHeading as="h1" eyebrow="CONTACT" title="Talk to us" intro="We usually reply within 1 to 2 business days." />
        <p>{SITE.address}</p>
        <p>{SITE.phone}</p>
        <p><a href={`mailto:${SITE.email}`} className="text-brand-red">{SITE.email}</a></p>
      </div>
      <div className="min-w-0 flex-[1_1_480px]"><ContactForm /></div>
    </Section>
  );
}
