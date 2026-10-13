import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES, formatPHP } from '@unik/shared/domain';
import { ButtonLink } from '@/components/site/ButtonLink';
import { PhotoCredit } from '@/components/site/PhotoCredit';
import { Section, SectionHeading } from '@/components/site/Section';
import { ARTJOY } from '@/content/artjoy';
import { FAQ } from '@/content/faq';
import { PAST_TOURS } from '@/content/pastTours';
import { RACE } from '@/content/race';
import { INCLUSIONS, PACKAGES } from '@/content/tour';
import { fetchTourConfig, lowestPrice } from '@/lib/tour/publicData';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Seoul Marathon 2027 Tour with Artjoy Torregosa',
  description:
    "Race the 2027 Seoul Marathon (March 21, 2027) with Artjoy Torregosa, the Philippine women's marathon record holder. Flights, hotel, race entry and support from the Philippines.",
};

function Check() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export default async function HomePage() {
  const config = await fetchTourConfig();
  const fromPrice = (c: (typeof CATEGORIES)[number]) => {
    const p = config ? lowestPrice(config, c) : null;
    return p === null ? 'Prices coming soon' : `From ${formatPHP(p)}`;
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-4 pb-16 pt-12 sm:px-6">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
            <p className="text-[13px] font-bold tracking-[0.16em] text-brand-sun">SEOUL MARATHON 2027 · TOUR PACKAGE</p>
            <h1 className="font-race text-[clamp(56px,7vw,96px)] font-extrabold uppercase italic leading-[0.92]">
              Run Seoul.
              <br />
              <span className="text-brand-sun">With Artjoy.</span>
            </h1>
            <p className="max-w-[540px] text-[19px] text-white/90">
              Race the 2027 Seoul Marathon alongside {ARTJOY.name}, the {ARTJOY.title}. Flights, hotel, race entry and
              race-weekend support in one package from the Philippines.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/apply" size="lg">Apply now</ButtonLink>
              <ButtonLink href="/tour" variant="outline-light" size="lg">See the tour</ButtonLink>
            </div>
            <p className="text-sm text-white/70">Booking through a travel agency? Use their link or have their promo code ready.</p>
          </div>
          <div className="relative h-[420px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-3xl sm:h-[520px]">
            <Image
              src="/images/seoul-marathon-gwanghwamun.jpg"
              alt="Runners passing the Admiral Yi Sun-sin statue at Gwanghwamun Square during the Seoul Marathon"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 560px"
              className="object-cover object-[45%_50%]"
            />
            <PhotoCredit />
          </div>
        </div>
        <div className="border-t border-white/15">
          <dl className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 px-4 py-7 sm:px-6">
            {[
              [RACE.dateShort, 'Race day, Sunday'],
              ['FULL · 10K', 'Plus companion, child and infant packages for non-runners'],
              ['MNL · CEB', 'Departures from Manila and Cebu'],
              [`${RACE.bibsTotal} BIBS`, 'Limited race entries for this tour'],
            ].map(([big, small]) => (
              <div key={big}>
                <dt className="font-race text-[34px] font-extrabold leading-tight text-brand-sun">{big}</dt>
                <dd className="text-sm text-white/75">{small}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Artjoy */}
      <Section id="artjoy">
        <div className="flex flex-wrap items-center gap-14">
          <div className="relative aspect-[2/3] w-full max-w-[460px] flex-[1_1_380px] overflow-hidden rounded-3xl">
            <Image src={ARTJOY.image} alt={ARTJOY.imageAlt} fill sizes="(max-width: 900px) 100vw, 460px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-5">
            <SectionHeading
              eyebrow="YOUR RUNNING CAPTAIN"
              title={`Meet ${ARTJOY.name}`}
              intro={`The ${ARTJOY.title}, ${ARTJOY.record}. ${ARTJOY.intro}`}
            />
            <ul className="mt-2 flex flex-col gap-4">
              {ARTJOY.program.map((p) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand-red">
                    <Check />
                  </span>
                  <span>
                    <span className="block font-extrabold text-brand-ink">{p.title}</span>
                    <span className="text-[15px]">{p.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] opacity-80">{ARTJOY.programNote}</p>
            <Link href="/artjoy" className="font-bold text-brand-red">More about Artjoy →</Link>
          </div>
        </div>
      </Section>

      {/* Race */}
      <Section id="race" tone="soft" className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="THE RACE"
          title={RACE.name}
          intro={`${RACE.edition}. One of Asia's major city marathons, running through the heart of Seoul in early spring.`}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {[
            ['RACE DATE', RACE.date, RACE.city],
            ['CATEGORIES', 'Full Marathon · 10K', '42.195 km or 10 km'],
            ['ASSEMBLY POINT', 'Gwanghwamun Square', `Full marathon (planned). 10K: Jamsil Sports Complex (planned). ${RACE.courseNote}`],
            ['TIME LIMIT', 'To be announced', 'Set by the race organizers.'],
          ].map(([label, value, note]) => (
            <div key={label} className="flex flex-col gap-1.5 rounded-[20px] bg-white p-7">
              <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{label}</p>
              <p className="text-[22px] font-extrabold text-brand-ink">{value}</p>
              <p className="text-sm">{note}</p>
            </div>
          ))}
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-3xl sm:h-[420px]">
          <Image
            src="/images/seoul-marathon-runners.jpg"
            alt="Thousands of Seoul Marathon runners filling a city road at dawn"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
          <PhotoCredit />
        </div>
      </Section>

      {/* Packages */}
      <Section id="tour" className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="THE TOUR"
          title="Everything handled. You just run."
          intro="Choose your package. Prices are per person on twin-share accommodation."
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {PACKAGES.map((pkg) => (
            <div key={pkg.category} className="flex flex-col gap-3 rounded-3xl border-2 border-brand-line p-8">
              <p className="font-race text-3xl font-extrabold uppercase text-brand-ink">{pkg.title}</p>
              <p className="text-[15px]">{pkg.description}</p>
              <p className="text-[28px] font-extrabold text-brand-ink">{fromPrice(pkg.category)}</p>
              <p className="text-sm">per person · twin share</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl bg-brand-soft p-8">
          <p className="mb-4 text-xl font-extrabold text-brand-ink">What&apos;s included</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="flex-none text-brand-red"><Check /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ButtonLink href="/tour" variant="outline-dark">Full tour details and itinerary</ButtonLink>
        </div>
      </Section>

      {/* Track record */}
      <Section tone="soft" className="flex flex-col gap-10">
        <SectionHeading eyebrow="OUR TRACK RECORD" title="We've taken Filipino fans to Korea before" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {PAST_TOURS.map((t) => (
            <div key={t.title} className="flex flex-col gap-2 rounded-3xl bg-white p-7">
              <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{t.year}</p>
              <p className="text-[22px] font-extrabold text-brand-ink">{t.title}</p>
              <p>{t.summary}</p>
            </div>
          ))}
        </div>
        <Link href="/past-tours" className="font-bold text-brand-red">See all past tours →</Link>
      </Section>

      {/* FAQ preview */}
      <Section id="faq" width="narrow" className="flex flex-col gap-8">
        <h2 className="font-race text-5xl font-extrabold uppercase text-brand-ink sm:text-[56px]">FAQ</h2>
        <dl className="border-t-2 border-brand-line">
          {FAQ.slice(0, 4).map((f) => (
            <div key={f.q} className="flex flex-col gap-1.5 border-b border-brand-line py-5">
              <dt className="text-lg font-extrabold text-brand-ink">{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/faq" className="font-bold text-brand-red">All questions →</Link>
      </Section>

      {/* CTA */}
      <section className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-4 py-20 sm:px-6">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-3">
            <h2 className="font-race text-5xl font-extrabold uppercase italic leading-none sm:text-[56px]">
              Slots are limited. <span className="text-brand-sun">Secure yours.</span>
            </h2>
            <p className="text-lg text-white/85">Apply now with no payment. Our team will contact you to confirm details.</p>
          </div>
          <ButtonLink href="/apply" size="lg">Apply now</ButtonLink>
        </div>
      </section>
    </>
  );
}
