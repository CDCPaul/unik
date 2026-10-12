import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { PAST_TOURS } from '@/content/pastTours';

export const metadata: Metadata = { title: 'Past tours', description: 'Tours CDC Travel has run for Filipino fans and runners in Korea.' };

export default function PastToursPage() {
  return (
    <Section className="flex flex-col gap-10">
      <SectionHeading eyebrow="OUR TRACK RECORD" title="We've taken Filipino fans to Korea before" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {PAST_TOURS.map((t) => (
          <article key={t.title} className="flex flex-col gap-2 rounded-3xl bg-brand-soft p-8">
            <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{t.year}</p>
            <h2 className="text-2xl font-extrabold text-brand-ink">{t.title}</h2>
            <p>{t.summary}</p>
          </article>
        ))}
      </div>
      <div><ButtonLink href="/">Join us for Seoul Marathon 2027</ButtonLink></div>
    </Section>
  );
}
