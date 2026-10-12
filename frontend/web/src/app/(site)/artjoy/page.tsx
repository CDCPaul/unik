import Image from 'next/image';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { ARTJOY } from '@/content/artjoy';

export const metadata: Metadata = {
  alternates: { canonical: '/artjoy' },
  title: 'Run with Artjoy Torregosa',
  description: `${ARTJOY.name}, the ${ARTJOY.title}, travels with our Seoul Marathon 2027 group.`,
};

export default function ArtjoyPage() {
  return (
    <Section className="flex flex-wrap items-start gap-14">
      <div className="relative aspect-[2/3] w-full max-w-[460px] flex-[1_1_360px] overflow-hidden rounded-3xl">
        <Image src={ARTJOY.image} alt={ARTJOY.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 460px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
        <SectionHeading as="h1" eyebrow="YOUR RUNNING CAPTAIN" title={ARTJOY.name} intro={`The ${ARTJOY.title}: ${ARTJOY.record}.`} />
        <p className="text-lg">{ARTJOY.intro}</p>
        <h2 className="text-2xl font-extrabold text-brand-ink">On tour with Artjoy</h2>
        <ul className="flex flex-col gap-4">
          {ARTJOY.program.map((p) => (
            <li key={p.title} className="rounded-2xl bg-brand-soft p-5">
              <p className="font-extrabold text-brand-ink">{p.title}</p>
              <p>{p.detail}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-80">{ARTJOY.programNote}</p>
        <div><ButtonLink href="/apply">Run Seoul with Artjoy</ButtonLink></div>
      </div>
    </Section>
  );
}
