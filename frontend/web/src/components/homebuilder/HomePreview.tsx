'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GalleryImage, HomeConfig, HomeProductKey, Player, TourPackage, ItineraryDay } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

function fontFamilyFromKey(key?: HomeConfig['hero']['titleFontFamily']) {
  if (key === 'inherit') return undefined;
  if (key === 'display') return 'var(--font-playfair), serif';
  if (key === 'serif') return 'serif';
  if (key === 'sans-serif') return 'var(--font-outfit), sans-serif';
  if (key === 'korean-sans') return 'var(--font-noto-kr), "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif';
  if (key === 'monospace') return 'monospace';
  return 'var(--font-playfair), serif';
}

function getTourDetailUrl(tour: TourPackage): string {
  if (tour.productCategory === 'courtside' || tour.productId?.startsWith('courtside')) return '/tour/courtside/itinerary';
  if (tour.productCategory === 'cherry-blossom' || tour.productId?.includes('cherry')) return '/cbm/itinerary';
  return '/tour/courtside/itinerary';
}

export default function HomePreview({
  device,
  config,
  productKey,
  tour,
  players,
  gallery,
}: {
  device: 'desktop' | 'mobile';
  config: HomeConfig;
  productKey: HomeProductKey;
  tour: TourPackage | null;
  players: Player[];
  gallery: GalleryImage[];
}) {
  const { theme } = useTheme();

  const sortedSections = (config.sections || []).slice().sort((a, b) => a.order - b.order).filter(s => s.enabled);
  const maxPlayers = (sortedSections.find(s => s.type === 'playersGrid') as any)?.props?.maxItems || 4;
  const maxGallery = (sortedSections.find(s => s.type === 'galleryPreview') as any)?.props?.maxItems || 6;

  const wrapperClass =
    device === 'mobile'
      ? 'mx-auto w-[390px] max-w-full border border-slate-200 rounded-xl overflow-hidden'
      : 'w-full border border-slate-200 rounded-xl overflow-hidden';

  const heroBgUrl =
    (device === 'mobile' ? config.hero.bgMobileUrl : config.hero.bgDesktopUrl) ||
    config.hero.bgDesktopUrl ||
    tour?.heroImageUrl ||
    tour?.thumbnailUrl ||
    '/images/hero-placeholder.jpg';

  const itineraryHighlights: ItineraryDay[] = (() => {
    if (!tour?.itinerary) return [];
    const all = tour.itinerary.filter(d => d.imageUrl || d.highlight);
    const onlyHighlighted = Boolean((sortedSections.find(s => s.type === 'highlightsFromItinerary') as any)?.props?.onlyHighlighted ?? true);
    const filtered = onlyHighlighted ? all.filter(d => d.highlight) : all;
    return filtered.filter(d => d.imageUrl).slice(0, (sortedSections.find(s => s.type === 'highlightsFromItinerary') as any)?.props?.maxItems || 3);
  })();

  const parseNightsFromDuration = (durationText: string): number | null => {
    const m = durationText.match(/(\d+)\s*Nights?/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const diffDaysInclusive = (startISO: string, endISO: string): number => {
    const [sy, sm, sd] = startISO.split('-').map(Number);
    const [ey, em, ed] = endISO.split('-').map(Number);
    if (![sy, sm, sd, ey, em, ed].every(Number.isFinite)) return 0;
    const start = Date.UTC(sy, sm - 1, sd);
    const end = Date.UTC(ey, em - 1, ed);
    const days = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(days, 0);
  };

  const homeDateLines = (() => {
    const d0 = tour?.departures?.[0];
    if (tour && d0) {
      const originsFromRoutes = (tour.flightRoutes || []).map(r => r.origin).filter(Boolean);
      const originsFromOverrides = (d0.datesByOrigin || []).map(x => x.origin).filter(Boolean);
      const origins = Array.from(new Set([...originsFromRoutes, ...originsFromOverrides]));

      if (origins.length > 1 && d0.datesByOrigin && d0.datesByOrigin.length > 0) {
        return origins.map((origin) => {
          const m = d0.datesByOrigin?.find(x => x.origin === origin);
          const dep = m?.departureDate || d0.departureDate;
          const ret = m?.returnDate || d0.returnDate;
          return { label: origin, text: `${dep} - ${ret}` };
        });
      }
      return [{ label: 'Date', text: `${d0.departureDate} - ${d0.returnDate}` }];
    }

    if (tour?.dates) return [{ label: 'Date', text: `${tour.dates.departure} - ${tour.dates.return}` }];
    return [{ label: 'Date', text: 'TBA' }];
  })();

  const homeDurationLines = (() => {
    const nights = parseNightsFromDuration(tour?.duration || '') ?? null;
    return homeDateLines.map((l) => {
      const parts = l.text.split(' - ');
      const dep = parts[0]?.trim();
      const ret = parts[1]?.trim();
      const tripDays = dep && ret ? diffDaysInclusive(dep, ret) : 0;
      const n = nights ?? (tripDays > 0 ? Math.max(tripDays - 1, 0) : 0);
      return {
        label: l.label,
        text: tripDays > 0 ? `${n} Nights ${tripDays} Days` : (tour?.duration || 'TBA'),
      };
    });
  })();

  return (
    <div className={wrapperClass} style={{ backgroundColor: theme.pageBg }}>
      {/* Hero */}
      <section className="relative min-h-[540px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-r from-dark-900 via-dark-900/80 to-transparent z-10" />
          <img src={heroBgUrl} alt="Hero Background" className="w-full h-full object-cover" />
        </div>

        <div className="container-custom relative z-20 pt-16">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 font-medium text-sm mb-6">
                {config.hero.badgeText || 'Official Tour Package'}
              </span>
              <h1
                className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: fontFamilyFromKey(config.hero.titleFontFamily) }}
              >
                {config.hero.titleText || tour?.title || 'Your Tour Title'}
              </h1>
              <p className="text-xl text-dark-200 mb-8 max-w-2xl" style={{ fontFamily: fontFamilyFromKey(config.hero.subtitleFontFamily as any) }}>
                {config.hero.subtitleText || tour?.subtitle || 'Your subtitle'}
              </p>

              <div className="flex flex-wrap gap-4">
                <span className="btn-primary" style={{ fontFamily: fontFamilyFromKey(config.hero.primaryCtaFontFamily as any) }}>
                  {config.hero.primaryCtaText || 'View Tour Details'}
                </span>
                <span className="btn-secondary" style={{ fontFamily: fontFamilyFromKey(config.hero.secondaryCtaFontFamily as any) }}>
                  {config.hero.secondaryCtaText || 'Book Now'} <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                </span>
              </div>
            </motion.div>

            {tour && (
              <div className="mt-10 w-fit max-w-full flex flex-wrap gap-6 px-6 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Date</p>
                    <div className="space-y-1">
                      {homeDateLines.map((l) => (
                        <div key={`${l.label}-${l.text}`} className="flex flex-wrap items-baseline gap-2">
                          {l.label !== 'Date' && <span className="text-white font-semibold">{l.label}</span>}
                          <span className="text-white font-medium">{l.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Duration</p>
                    <div className="space-y-1">
                      {homeDurationLines.map((l) => (
                        <div key={`dur-${l.label}-${l.text}`} className="flex flex-wrap items-baseline gap-2">
                          {l.label !== 'Date' && <span className="text-white font-semibold">{l.label}</span>}
                          <span className="text-white font-medium">{l.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sections */}
      {sortedSections.map((s) => {
        if (s.type === 'spacer') {
          const h = (s as any).props?.height || 'md';
          const py = h === 'sm' ? 'py-8' : h === 'lg' ? 'py-24' : 'py-16';
          return <div key={s.id} className={py} />;
        }

        if (s.type === 'playersGrid') {
          const heading = (s as any).props?.heading || 'Filipino Stars';
          const headingFontFamily = fontFamilyFromKey((s as any).props?.headingFontFamily as any);
          const subheading = (s as any).props?.subheading || '';
          const subheadingFontFamily = fontFamilyFromKey((s as any).props?.subheadingFontFamily as any);
          const ctaText = (s as any).props?.ctaText || 'View All Players';
          const ctaFontFamily = fontFamilyFromKey((s as any).props?.ctaFontFamily as any);
          return (
            <section key={s.id} className="py-24 bg-dark-900">
              <div className="container-custom">
                <div className="flex items-end justify-between mb-12">
                  <div>
                    <h2 className="section-heading mb-2" style={{ fontFamily: headingFontFamily }}>
                      {heading}
                    </h2>
                    {subheading && (
                      <p className="text-dark-400" style={{ fontFamily: subheadingFontFamily }}>
                        {subheading}
                      </p>
                    )}
                  </div>
                  <span className="hidden md:flex items-center gap-2 text-gold-500" style={{ fontFamily: ctaFontFamily }}>
                    {ctaText} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                  {players.slice(0, maxPlayers).map((p) => (
                    <div key={p.id} className="card overflow-hidden">
                      <div className="aspect-3/4 relative overflow-hidden bg-dark-800">
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Star className="w-12 h-12 text-dark-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-dark-950 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="text-gold-500 text-xs font-bold uppercase mb-1">{p.position}</div>
                          <h3 className="text-white font-bold text-lg">{p.name}</h3>
                          <p className="text-dark-400 text-xs">{p.team}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (s.type === 'highlightsFromItinerary') {
          const heading = (s as any).props?.heading || 'Highlights';
          const headingFontFamily = fontFamilyFromKey((s as any).props?.headingFontFamily as any);
          const subheading = (s as any).props?.subheading || '';
          const subheadingFontFamily = fontFamilyFromKey((s as any).props?.subheadingFontFamily as any);
          return (
            <section key={s.id} className="py-24 bg-dark-950">
              <div className="container-custom">
                <div className="text-center mb-16">
                  <h2 className="section-heading mb-4" style={{ fontFamily: headingFontFamily }}>
                    {heading}
                  </h2>
                  {subheading && (
                    <p className="text-dark-400" style={{ fontFamily: subheadingFontFamily }}>
                      {subheading}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {itineraryHighlights.map((d) => (
                    <div key={d.day} className="card overflow-hidden">
                      <div className="aspect-video bg-dark-800 relative">
                        {d.imageUrl ? (
                          <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-dark-600">No image</div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-dark-950 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="text-gold-500 text-xs font-bold uppercase mb-1">Day {d.day}</div>
                          <h3 className="text-white font-bold text-lg">{d.title}</h3>
                          <p className="text-dark-400 text-xs">{d.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {itineraryHighlights.length === 0 && (
                    <div className="md:col-span-3 text-center text-dark-400">No highlight itinerary images found.</div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (s.type === 'galleryPreview') {
          const heading = (s as any).props?.heading || 'Tour Gallery';
          const headingFontFamily = fontFamilyFromKey((s as any).props?.headingFontFamily as any);
          const subheading = (s as any).props?.subheading || '';
          const subheadingFontFamily = fontFamilyFromKey((s as any).props?.subheadingFontFamily as any);
          const ctaText = (s as any).props?.ctaText || 'View Full Gallery';
          const ctaFontFamily = fontFamilyFromKey((s as any).props?.ctaFontFamily as any);
          return (
            <section key={s.id} className="py-24 bg-dark-950">
              <div className="container-custom">
                <div className="text-center mb-16">
                  <h2 className="section-heading mb-4" style={{ fontFamily: headingFontFamily }}>
                    {heading}
                  </h2>
                  {subheading && (
                    <p className="text-dark-400" style={{ fontFamily: subheadingFontFamily }}>
                      {subheading}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.slice(0, maxGallery).map((img, idx) => (
                    <div key={img.id} className={`rounded-xl overflow-hidden relative aspect-square ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
                      <img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <span className="btn-secondary" style={{ fontFamily: ctaFontFamily }}>
                    {ctaText}
                  </span>
                </div>
              </div>
            </section>
          );
        }

        // cta
        const heading = (s as any).props?.heading || "Don't Miss the Action!";
        const headingFontFamily = fontFamilyFromKey((s as any).props?.headingFontFamily as any);
        const body = (s as any).props?.body || '';
        const bodyFontFamily = fontFamilyFromKey((s as any).props?.bodyFontFamily as any);
        const buttonText = (s as any).props?.buttonText || 'Register Now';
        const buttonFontFamily = fontFamilyFromKey((s as any).props?.buttonFontFamily as any);
        return (
          <section key={s.id} className="py-24 bg-premium-gradient relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-10" />
            <div className="container-custom relative z-10 text-center">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6" style={{ fontFamily: headingFontFamily }}>
                {heading}
              </h2>
              {body && (
                <p className="text-lg text-dark-200 mb-10 max-w-2xl mx-auto" style={{ fontFamily: bodyFontFamily }}>
                  {body}
                </p>
              )}
              <span className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20" style={{ fontFamily: buttonFontFamily }}>
                {buttonText}
              </span>
            </div>
          </section>
        );
      })}
    </div>
  );
}


