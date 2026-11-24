import type { Metadata } from 'next';
import { formatPHP, isValidPrice } from '@unik/shared/domain';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { EXCLUSIONS, INCLUSIONS, ITINERARY, ITINERARY_NOTE, PACKAGES } from '@/content/tour';
import { fetchTourConfig } from '@/lib/tour/publicData';
import { groupDeparturesByRates, splitFlightLegs } from '@/lib/tour/rates';

export const revalidate = 60;
export const metadata: Metadata = {
  alternates: { canonical: '/tour' },
  title: 'The Tour',
  description: 'Packages, prices, departures, inclusions and itinerary for the Seoul Marathon 2027 tour.',
};

export default async function TourPage() {
  const config = await fetchTourConfig();
  const departures = config?.departures.filter((d) => d.isOpen) ?? [];
  const rateGroups = groupDeparturesByRates(departures);
  return (
    <>
      <Section tone="ink">
        <SectionHeading as="h1" tone="dark" eyebrow="THE TOUR" title="Everything handled. You just run." intro="Prices are per person on twin-share accommodation, except no-bed children and infants, who share a parent's bed." />
      </Section>
      <Section className="flex flex-col gap-12">
        {departures.length === 0 ? (
          <p className="rounded-2xl bg-brand-soft p-6 font-semibold text-brand-ink">Departures and prices will be announced soon.</p>
        ) : (
          <>
            {/* 출발편 목록: 이름(직원이 입력, 날짜 포함)과 항공편만 짧게 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-brand-ink">Departures</h2>
              <ul className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
                {departures.map((d) => {
                  const legs = splitFlightLegs(d.flightInfo);
                  return (
                    <li key={d.id} className="flex flex-col gap-1.5 rounded-2xl border-2 border-brand-line p-4 sm:p-5">
                      <p className="text-lg font-extrabold text-brand-ink">{d.label}</p>
                      {legs.length > 0 ? (
                        <dl className="flex flex-col gap-1 text-sm">
                          {legs.map((leg, i) => (
                            <div key={i} className={leg.label ? 'grid grid-cols-[72px_1fr] gap-2' : ''}>
                              {leg.label ? <dt className="font-bold text-brand-ink">{leg.label}</dt> : null}
                              <dd>{leg.text}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* 가격이 같은 출발편끼리 묶어 한 번만 보여준다. 지금처럼 모두 같으면 "Rates" 한 묶음. */}
            <div id="rates" className="flex scroll-mt-6 flex-col gap-10">
              {rateGroups.map((group) => {
                const d = group[0];
                return (
                  <div key={d.id} className="flex flex-col gap-4">
                    <h2 className="text-2xl font-extrabold text-brand-ink">
                      {rateGroups.length === 1 ? 'Rates' : `Rates · ${group.map((g) => g.label).join(' / ')}`}
                    </h2>
                    {rateGroups.length === 1 && departures.length > 1 ? (
                      <p className="-mt-2 text-sm">Same prices for every departure.</p>
                    ) : null}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 sm:gap-4">
                      {/* 가격이 없는 유형(예전 설정의 아동 10K·침대 없음 등)은 보여주지 않는다 */}
                      {PACKAGES.filter((p) => isValidPrice(d.prices?.[p.category])).map((p) => (
                        <div key={p.category} className="rounded-3xl border-2 border-brand-line p-4 sm:p-6">
                          {/* 모바일: 이름과 가격을 한 줄에, sm 이상: 지금처럼 위아래 */}
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 sm:block">
                            <p className="font-race text-xl font-extrabold uppercase text-brand-ink sm:text-2xl">{p.title}</p>
                            <p className="text-xl font-extrabold text-brand-ink sm:text-[26px]">{formatPHP(d.prices[p.category])}</p>
                          </div>
                          <p className="text-sm">{p.description}</p>
                          {p.notice ? <p className="mt-2 text-sm font-bold text-brand-red">{p.notice}</p> : null}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm">
                      Single room supplement: {formatPHP(d.singleSupplement)} per person. Deposit after confirmation:{' '}
                      {config ? formatPHP(config.depositPerPax) : ''} per person.
                    </p>
                  </div>
                );
              })}
            </div>
          </>
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
