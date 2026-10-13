import type { Metadata } from 'next';
import { formatPHP, isValidPrice } from '@unik/shared/domain';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { EXCLUSIONS, INCLUSIONS, ITINERARY, ITINERARY_NOTE, PACKAGES } from '@/content/tour';
import { fetchTourConfig } from '@/lib/tour/publicData';

export const revalidate = 60;
export const metadata: Metadata = {
  alternates: { canonical: '/tour' },
  title: 'The Tour',
  description: 'Packages, prices, departures, inclusions and itinerary for the Seoul Marathon 2027 tour.',
};

export default async function TourPage() {
  const config = await fetchTourConfig();
  const departures = config?.departures.filter((d) => d.isOpen) ?? [];
  return (
    <>
      <Section tone="ink">
        <SectionHeading as="h1" tone="dark" eyebrow="THE TOUR" title="Everything handled. You just run." intro="Prices are per person on twin-share accommodation." />
      </Section>
      <Section className="flex flex-col gap-12">
        {departures.length === 0 ? (
          <p className="rounded-2xl bg-brand-soft p-6 font-semibold text-brand-ink">Departures and prices will be announced soon.</p>
        ) : (
          departures.map((d) => (
            <div key={d.id} className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-brand-ink">
                {d.label} · {d.departDate} to {d.returnDate}
              </h2>
              {d.flightInfo ? <p className="text-sm">{d.flightInfo}</p> : null}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                {/* 가격이 없는 유형(예전 설정의 child/infant 등)은 보여주지 않는다 */}
                {PACKAGES.filter((p) => isValidPrice(d.prices?.[p.category])).map((p) => (
                  <div key={p.category} className="rounded-3xl border-2 border-brand-line p-6">
                    <p className="font-race text-2xl font-extrabold uppercase text-brand-ink">{p.title}</p>
                    <p className="text-[26px] font-extrabold text-brand-ink">{formatPHP(d.prices[p.category])}</p>
                    <p className="text-sm">{p.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Single room supplement: {formatPHP(d.singleSupplement)} per person. Deposit after confirmation:{' '}
                {config ? formatPHP(config.depositPerPax) : ''} per person.
              </p>
            </div>
          ))
        )}
        <div className="flex flex-wrap gap-6">
          <div className="min-w-0 flex-[1_1_420px] rounded-3xl bg-brand-soft p-8">
            <h2 className="mb-4 text-xl font-extrabold text-brand-ink">What&apos;s included</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">{INCLUSIONS.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div className="min-w-0 flex-[1_1_320px] rounded-3xl border-2 border-brand-line p-8">
            <h2 className="mb-4 text-xl font-extrabold text-brand-ink">Not included</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">{EXCLUSIONS.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-extrabold text-brand-ink">Itinerary</h2>
            <p className="text-sm">{ITINERARY_NOTE}</p>
          </div>
          <ol className="border-t-2 border-brand-line">
            {ITINERARY.map((d) => (
              <li key={d.day} className="flex flex-wrap gap-x-6 gap-y-2 border-b border-brand-line py-4">
                <span className="w-[90px] flex-none font-race text-2xl font-extrabold text-brand-red">{d.day}</span>
                <span className="flex-[1_1_400px]"><b className="text-brand-ink">{d.title}</b> {d.detail}</span>
              </li>
            ))}
          </ol>
        </div>
        <div><ButtonLink href="/apply">Apply now</ButtonLink></div>
      </Section>
    </>
  );
}
