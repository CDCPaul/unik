import Image from 'next/image';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { PhotoCredit } from '@/components/site/PhotoCredit';
import { Section, SectionHeading } from '@/components/site/Section';
import { RACE } from '@/content/race';

export const metadata: Metadata = {
  alternates: { canonical: '/seoul-marathon' },
  title: 'Seoul Marathon 2027',
  description: `${RACE.edition} on ${RACE.date}. Full marathon and 10K race information for our tour participants.`,
};

export default function SeoulMarathonPage() {
  return (
    <>
      <Section tone="ink">
        <SectionHeading as="h1" tone="dark" eyebrow="THE RACE" title={RACE.name} intro={`${RACE.edition} · ${RACE.date} · ${RACE.city}`} />
      </Section>
      <Section className="flex flex-col gap-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {RACE.categories.map((c) => (
            <div key={c.key} className="flex flex-col gap-2 rounded-3xl border-2 border-brand-line p-8">
              <p className="font-race text-3xl font-extrabold uppercase text-brand-ink">{c.label}</p>
              <p className="text-lg font-bold">{c.distance}</p>
              <p>Assembly: {c.assembly}</p>
            </div>
          ))}
        </div>
        <dl className="grid gap-4 rounded-3xl bg-brand-soft p-8 sm:grid-cols-2">
          <div><dt className="font-extrabold text-brand-ink">Race date</dt><dd>{RACE.date}</dd></div>
          <div><dt className="font-extrabold text-brand-ink">Course</dt><dd>{RACE.courseNote}</dd></div>
          <div><dt className="font-extrabold text-brand-ink">Time limit</dt><dd>{RACE.timeLimit}</dd></div>
          <div>
            <dt className="font-extrabold text-brand-ink">Official website</dt>
            <dd><a href={RACE.officialSite} className="text-brand-red" rel="noopener noreferrer" target="_blank">seoul-marathon.com</a></dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold text-brand-ink">How race entry works on this tour</h2>
          <p>
            General registration for the 2027 race has closed. Our tour has {RACE.bibsTotal} race entries allocated through our
            partnership, shared between the full marathon and the 10K. We register you with the organizers once your slot is
            confirmed. Entries are first come, first served.
          </p>
          <p className="text-sm">Full marathon eligibility requirements, if any, will be confirmed with you after you apply. [TBC: eligibility requirements]</p>
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-3xl sm:h-[420px]">
          <Image src="/images/seoul-marathon-runners.jpg" alt="Thousands of Seoul Marathon runners filling a city road at dawn" fill sizes="100vw" className="object-cover" />
          <PhotoCredit />
        </div>
        <div><ButtonLink href="/apply">Apply for the tour</ButtonLink></div>
      </Section>
    </>
  );
}
