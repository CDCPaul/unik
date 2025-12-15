'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Plane, Clock, Info, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTours } from '@/lib/services/tours';
import type { TourPackage } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

interface TourOverviewProps {
  productCategory: 'courtside' | 'cherry-blossom';
}

export default function TourOverview({ productCategory }: TourOverviewProps) {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'regular' | 'special-event'>('special-event');
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

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

  const getDepartureBadgeText = (tour: TourPackage) => {
    if (!tour.departures || tour.departures.length === 0) return 'Tour Dates TBA';
    const d0 = tour.departures[0];
    const originsFromRoutes = (tour.flightRoutes || []).map(r => r.origin).filter(Boolean);
    const originsFromOverrides = (d0.datesByOrigin || []).map(x => x.origin).filter(Boolean);
    const origins = Array.from(new Set([...originsFromRoutes, ...originsFromOverrides]));

    if (origins.length > 1 && d0.datesByOrigin && d0.datesByOrigin.length > 0) {
      const parts = origins.map((o) => {
        const m = d0.datesByOrigin?.find(x => x.origin === o);
        const dep = m?.departureDate || d0.departureDate;
        const ret = m?.returnDate || d0.returnDate;
        return `${o}: ${dep} - ${ret}`;
      });
      return parts.join(' • ');
    }
    return `${d0.departureDate} - ${d0.returnDate}`;
  };

  const getItineraryUrl = (tour: TourPackage) => {
    if (tour.productCategory === 'courtside' || tour.productId?.startsWith('courtside')) return '/tour/courtside/itinerary';
    if (tour.productCategory === 'cherry-blossom' || tour.productId?.includes('cherry')) return '/cbm/itinerary';
    return '/tour/courtside/itinerary';
  };

  const getOverviewDateLines = (tour: TourPackage) => {
    const d0 = tour.departures?.[0];
    if (d0) {
      const originsFromRoutes = (tour.flightRoutes || []).map(r => r.origin).filter(Boolean);
      const originsFromOverrides = (d0.datesByOrigin || []).map(x => x.origin).filter(Boolean);
      const origins = Array.from(new Set([...originsFromRoutes, ...originsFromOverrides]));

      if (origins.length > 1 && d0.datesByOrigin && d0.datesByOrigin.length > 0) {
        return origins.map((origin) => {
          const m = d0.datesByOrigin?.find(x => x.origin === origin);
          const dep = m?.departureDate || d0.departureDate;
          const ret = m?.returnDate || d0.returnDate;
          return { label: origin, dep, ret, text: `${dep} - ${ret}` };
        });
      }
      return [{ label: 'Date', dep: d0.departureDate, ret: d0.returnDate, text: `${d0.departureDate} - ${d0.returnDate}` }];
    }

    if (tour.dates) return [{ label: 'Date', dep: tour.dates.departure, ret: tour.dates.return, text: `${tour.dates.departure} - ${tour.dates.return}` }];
    return [{ label: 'Date', dep: '', ret: '', text: 'TBA' }];
  };

  const getOverviewDurationLines = (tour: TourPackage) => {
    const nights = parseNightsFromDuration(tour.duration) ?? null;
    return getOverviewDateLines(tour).map((l) => {
      const tripDays = l.dep && l.ret ? diffDaysInclusive(l.dep, l.ret) : 0;
      const n = nights ?? (tripDays > 0 ? Math.max(tripDays - 1, 0) : 0);
      return { label: l.label, text: tripDays > 0 ? `${n} Nights ${tripDays} Days` : tour.duration };
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const allTours = await getTours();
        // Filter by product category and active status
        const categoryTours = allTours.filter(
          t => (t.productCategory === productCategory || t.productId?.startsWith(productCategory)) && t.isActive
        );
        setTours(categoryTours);

        // Auto-select tab based on available tours
        const hasSpecial = categoryTours.some(t => t.tourType === 'special-event' || t.productId?.includes('special'));
        const hasRegular = categoryTours.some(t => t.tourType === 'regular' || (!t.productId?.includes('special') && t.productId?.includes(productCategory)));
        
        if (hasSpecial) {
          setActiveTab('special-event');
        } else if (hasRegular) {
          setActiveTab('regular');
        }
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productCategory]);

  // (Navbar behavior is handled in Navbar/ProductTabs; keep hero overlay consistent.)

  // Get current tour based on active tab
  const currentTour = tours.find(t => {
    if (t.tourType) {
      return t.tourType === activeTab;
    }
    // Legacy support
    if (activeTab === 'special-event') {
      return t.productId?.includes('special');
    }
    return t.productId === productCategory;
  }) || tours[0];

  const hasRegular = tours.some(t => t.tourType === 'regular' || (!t.productId?.includes('special') && t.productId?.includes(productCategory)));
  const hasSpecial = tours.some(t => t.tourType === 'special-event' || t.productId?.includes('special'));

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex justify-center items-center" style={{ backgroundColor: theme.pageBg }}>
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  if (!currentTour) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center container-custom text-center py-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
        <h1 className="text-3xl font-display font-bold mb-4" style={{ color: theme.headingText }}>No Tours Available</h1>
        <p className="mb-8" style={{ color: theme.mutedText }}>We are currently preparing tour packages. Please check back soon!</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Tour Type Tabs (if both types exist) */}
      {(hasRegular && hasSpecial) && (
        <div className="sticky top-20 z-40 py-4 border-b" style={{ backgroundColor: theme.pageBg, borderColor: theme.cardBg }}>
          <div className="container-custom flex gap-4">
            <button
              onClick={() => setActiveTab('regular')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300`}
              style={{
                color: activeTab === 'regular' ? theme.primaryBtnText : theme.mutedText,
                backgroundColor: activeTab === 'regular' ? theme.primaryBtnBg : theme.cardBg,
                border: `1px solid ${activeTab === 'regular' ? theme.primaryBtnBg : theme.cardBg}`,
              }}
            >
              Regular Tours
            </button>
            <button
              onClick={() => setActiveTab('special-event')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300`}
              style={{
                color: activeTab === 'special-event' ? theme.primaryBtnText : theme.mutedText,
                backgroundColor: activeTab === 'special-event' ? theme.primaryBtnBg : theme.cardBg,
                border: `1px solid ${activeTab === 'special-event' ? theme.primaryBtnBg : theme.cardBg}`,
              }}
            >
              ⭐ Special Events
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to right, ${theme.pageBg}, ${theme.pageBg}cc, transparent)`,
            }}
          />
          {currentTour.heroImageUrl ? (
            <img 
              src={currentTour.heroImageUrl} 
              alt="Hero Background" 
              className="w-full h-full object-cover md:object-cover md:scale-100 scale-110"
            />
          ) : currentTour.thumbnailUrl ? (
            <img 
              src={currentTour.thumbnailUrl} 
              alt="Hero Background" 
              className="w-full h-full object-cover md:object-cover md:scale-100 scale-110"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${theme.pageBg}, ${theme.footerBg})` }}
            />
          )}
        </div>

        <div className="container-custom relative z-20 pt-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span
                className="inline-block py-1 px-3 rounded-full font-medium text-sm mb-6"
                style={{
                  backgroundColor: `${theme.goldColor}1a`,
                  border: `1px solid ${theme.goldColor}4d`,
                  color: theme.goldColor,
                }}
              >
                Official Tour Package
              </span>
              <h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                style={{ color: theme.headingText, fontFamily: 'var(--font-playfair), serif' }}
              >
                {currentTour.title}
              </h1>
              <p className="text-xl mb-8 max-w-2xl" style={{ color: theme.bodyText }}>
                {currentTour.subtitle}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={productCategory === 'courtside' ? '/tour/courtside' : '/cbm'} 
                  className="btn-primary"
                >
                  View Tour Details
                </Link>
                <Link href={`/register?tourId=${currentTour.id}`} className="btn-secondary">
                  Book Now <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>

            {/* Quick Info */}
            {currentTour && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 w-fit max-w-full flex flex-wrap gap-6 px-6 py-5 rounded-2xl border"
                style={{ backgroundColor: `${theme.pageBg}80`, borderColor: `${theme.headingText}10`, backdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.goldColor}10`, color: theme.goldColor }}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider" style={{ color: theme.mutedText }}>Date</div>
                    <div className="space-y-1 mt-1">
                      {getOverviewDateLines(currentTour).map((l) => (
                        <div key={`${l.label}-${l.text}`} className="flex flex-wrap items-baseline gap-2">
                          {l.label !== 'Date' && <span className="font-semibold" style={{ color: theme.headingText }}>{l.label}</span>}
                          <span className="font-semibold" style={{ color: theme.headingText }}>{l.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.goldColor}10`, color: theme.goldColor }}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider" style={{ color: theme.mutedText }}>Duration</div>
                    <div className="space-y-1 mt-1">
                      {getOverviewDurationLines(currentTour).map((l) => (
                        <div key={`dur-${l.label}-${l.text}`} className="flex flex-wrap items-baseline gap-2">
                          {l.label !== 'Date' && <span className="font-semibold" style={{ color: theme.headingText }}>{l.label}</span>}
                          <span className="font-semibold" style={{ color: theme.headingText }}>{l.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Page Header */}
      <section className="pt-12 pb-12" style={{ backgroundColor: theme.pageBg }}>
        <div className="container-custom">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
              style={{
                backgroundColor: `${theme.goldColor}1a`,
                borderColor: `${theme.goldColor}33`,
                color: theme.goldColor,
              }}
            >
              <span className="text-xs font-bold">
                {currentTour.tourType === 'special-event' ? '⭐ SPECIAL EVENT' : 'REGULAR TOUR'}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight"
              style={{ color: theme.headingText }}
            >
              {currentTour.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg mb-6 max-w-2xl"
              style={{ color: theme.bodyText }}
            >
              {currentTour.subtitle}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/register" className="btn-gold">
                Book Now
              </Link>
              <Link href={getItineraryUrl(currentTour)} className="btn-secondary">
                View Itinerary
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Info */}
      <section className="py-16 border-y" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-bold tracking-wider text-sm uppercase" style={{ color: theme.goldColor }}>Main Event</span>
              <h2 className="text-3xl font-display font-bold mt-2 mb-6" style={{ color: theme.headingText }}>
                {productCategory === 'courtside'
                  ? (currentTour.gameInfo.matchup || 'Main Event')
                  : (currentTour.title || 'Main Event')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>Date & Time</h3>
                    <p style={{ color: theme.bodyText }}>{currentTour.gameInfo.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>
                      {productCategory === 'courtside' ? 'Venue' : 'Location'}
                    </h3>
                    <p style={{ color: theme.bodyText }}>{currentTour.gameInfo.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>
                      {productCategory === 'courtside' ? 'About' : 'Event Info'}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: theme.bodyText }}>{currentTour.gameInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: theme.secondaryBtnBorder }}>
                {(() => {
                  // Priority 1: Use heroImageUrl (uploaded in admin)
                  if (currentTour.heroImageUrl) {
                    return (
                      <img
                        src={currentTour.heroImageUrl}
                        alt={currentTour.title}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  
                  // Priority 2: Find highlight day with image
                  const highlightDay = currentTour.itinerary?.find(day => day.highlight && day.imageUrl);
                  
                  if (highlightDay?.imageUrl) {
                    return (
                      <img
                        src={highlightDay.imageUrl}
                        alt={highlightDay.title}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  
                  // Fallback to placeholder
                  return (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.cardBg}, ${theme.pageBg})` }}
                    >
                      <span className="text-4xl font-display font-bold" style={{ color: `${theme.headingText}20` }}>
                        {productCategory === 'courtside' ? 'KBL' : 'MARATHON'}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: `${theme.goldColor}20` }} />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${theme.accentColor}20` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & CTA */}
      <section className="py-24 bg-premium-gradient relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-10" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 border text-center"
            style={{
              backgroundColor: `${theme.pageBg}80`,
              backdropFilter: 'blur(12px)',
              borderColor: `${theme.headingText}10`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6" style={{ color: theme.headingText }}>
              Ready for the Ultimate Experience?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: theme.bodyText }}>
              {currentTour.subtitle}
            </p>

            {currentTour.pricingByOrigin && currentTour.pricingByOrigin.length > 0 ? (
              <div className="max-w-2xl mx-auto mb-10">
                <p className="text-sm uppercase tracking-wider mb-4" style={{ color: theme.mutedText }}>
                  Pricing by Departure City
                </p>
                <div className="space-y-4">
                  {(() => {
                    const originsFromRoutes = (currentTour.flightRoutes || []).map(r => r.origin).filter(Boolean);
                    const originsFromPricing = (currentTour.pricingByOrigin || []).map(p => p.origin).filter(Boolean);
                    const origins = Array.from(new Set([...originsFromRoutes, ...originsFromPricing]));

                    return origins.map((origin) => {
                      const p = currentTour.pricingByOrigin?.find(x => x.origin === origin);
                      const currency = (p?.currency || currentTour.pricing.currency);
                    return (
                      <div
                        key={origin}
                        className="rounded-xl border p-6"
                        style={{ backgroundColor: `${theme.cardBg}80`, borderColor: theme.secondaryBtnBorder }}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                          <div className="text-lg font-bold" style={{ color: theme.headingText }}>
                            {origin}
                          </div>
                          <div className="text-xs" style={{ color: theme.mutedText }}>
                            Adult / Child
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedText }}>Adult (12+)</p>
                            <div className="text-2xl font-bold" style={{ color: theme.headingText }}>
                              <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currency}</span>
                              {(p?.adult ?? currentTour.pricing.adult).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedText }}>Child (&lt;12)</p>
                            <div className="text-2xl font-bold" style={{ color: theme.headingText }}>
                              <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currency}</span>
                              {(p?.child ?? currentTour.pricing.child).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto mb-10">
                <div className="p-6 rounded-xl border" style={{ backgroundColor: `${theme.cardBg}80`, borderColor: theme.secondaryBtnBorder }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: theme.mutedText }}>Adult (12+)</p>
                  <div className="text-3xl font-bold" style={{ color: theme.headingText }}>
                    <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currentTour.pricing.currency}</span>
                    {currentTour.pricing.adult.toLocaleString()}
                  </div>
                </div>
                <div className="p-6 rounded-xl border" style={{ backgroundColor: `${theme.cardBg}80`, borderColor: theme.secondaryBtnBorder }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: theme.mutedText }}>Child (&lt;12)</p>
                  <div className="text-3xl font-bold" style={{ color: theme.headingText }}>
                    <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currentTour.pricing.currency}</span>
                    {currentTour.pricing.child.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <Link href="/register" className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20">
              Book Your Spot Now
            </Link>
            <p className="mt-4 text-sm" style={{ color: theme.mutedText }}>Limited seats available. First come, first served.</p>
          </div>
        </div>
      </section>
    </>
  );
}

