import Link from 'next/link';
import type { Metadata } from 'next';
import { Section } from '@/components/site/Section';
import { FAQ } from '@/content/faq';

export const metadata: Metadata = { alternates: { canonical: '/faq' }, title: 'FAQ', description: 'Answers to common questions about the Seoul Marathon 2027 tour.' };

export default function FaqPage() {
  return (
    <Section width="narrow" className="flex flex-col gap-8">
      <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink sm:text-[56px]">FAQ</h1>
      <dl className="border-t-2 border-brand-line">
        {FAQ.map((f) => (
          <div key={f.q} className="flex flex-col gap-1.5 border-b border-brand-line py-5">
            <dt className="text-lg font-extrabold text-brand-ink">{f.q}</dt>
            <dd>
              {f.a}{' '}
              {'link' in f && f.link ? <Link href={f.link.href} className="font-bold text-brand-red">{f.link.label}</Link> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        Still have a question? <Link href="/contact" className="font-bold text-brand-red">Contact us</Link>.
      </p>
    </Section>
  );
}
