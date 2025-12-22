'use client';

import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MapPin, Plane, Info, Utensils, RefreshCw } from 'lucide-react';
import { getTours } from '@/lib/services/tours';
import Link from 'next/link';
import type { TourPackage, TourDeparture } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';
import { logEvent } from 'firebase/analytics';
import { initAnalytics } from '@/lib/firebase';

interface TourItineraryProps {
  productCategory: 'courtside' | 'cherry-blossom';
  tourType?: 'regular' | 'special-event';
}

function ItineraryDayCarousel({
  dayKey,
  title,
  imageUrls,
  getIndex,
  setIndex,
}: {
  dayKey: string;
  title: string;
  imageUrls: string[];
  getIndex: (key: string) => number;
  setIndex: (key: string, idx: number) => void;
}) {
  const idx = getIndex(dayKey);
  const has = imageUrls.length > 0;
  const currentUrl = has ? imageUrls[idx % imageUrls.length] : '';
  const [direction, setDirection] = useState(0);

  const goPrev = () => {
    if (!has || imageUrls.length <= 1) return;
    setDirection(-1);
    setIndex(dayKey, (idx - 1 + imageUrls.length) % imageUrls.length);
  };

  const goNext = () => {
    if (!has || imageUrls.length <= 1) return;
    setDirection(1);
    setIndex(dayKey, (idx + 1) % imageUrls.length);
  };

  const swipeConfidenceThreshold = 8000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div
      className="card overflow-hidden h-full flex flex-col min-h-0"
      style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
    >
      <div
        className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md relative flex-1 min-h-[220px] sm:min-h-[280px] md:min-h-0"
        style={{
          // Let the browser keep vertical scrolling; horizontal swipe handled by Motion drag.
          touchAction: has && imageUrls.length > 1 ? 'pan-y' : 'auto',
        }}
      >
        {has ? (
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentUrl}
              src={currentUrl}
              alt={title}
              className="w-full h-full object-cover"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              drag={imageUrls.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={(_, info) => {
                if (imageUrls.length <= 1) return;
                const swipe = swipePower(info.offset.x, info.velocity.x);
                if (swipe > swipeConfidenceThreshold) {
                  goPrev();
                } else if (swipe < -swipeConfidenceThreshold) {
                  goNext();
                }
              }}
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-dark-400">
            No photos uploaded for this day.
          </div>
        )}

        {has && imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>

      {has && imageUrls.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {imageUrls.map((_, i) => (
            <button
              key={`${dayKey}-dot-${i}`}
              type="button"
              onClick={() => setIndex(dayKey, i)}
              className={`h-2 w-2 rounded-full ${i === idx ? 'bg-gold-500' : 'bg-white/20 hover:bg-white/40'}`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TourItinerary({ productCategory, tourType }: TourItineraryProps) {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const [carouselIndexByDay, setCarouselIndexByDay] = useState<Record<string, number>>({});

  const getCarouselIndex = (key: string) => carouselIndexByDay[key] ?? 0;
  const setCarouselIndex = (key: string, idx: number) =>
    setCarouselIndexByDay((prev) => ({ ...prev, [key]: idx }));

  const parseNightsFromDuration = (durationText: string): number | null => {
    const m = durationText.match(/(\d+)\s*Nights?/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const diffDaysInclusive = (startISO: string, endISO: string): number => {
    // Use UTC to avoid TZ shifts.
    const [sy, sm, sd] = startISO.split('-').map(Number);
    const [ey, em, ed] = endISO.split('-').map(Number);
    if (![sy, sm, sd, ey, em, ed].every(Number.isFinite)) return 0;
    const start = Date.UTC(sy, sm - 1, sd);
    const end = Date.UTC(ey, em - 1, ed);
    const days = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(days, 0);
  };

  const flightOrigins = (() => {
    const routes = selectedTour?.flightRoutes || [];
    const origins = routes.map(r => r.origin).filter(Boolean);
    return Array.from(new Set(origins));
  })();

  const getDatesForOrigin = (dep: TourDeparture, origin: string) => {
    const match = dep.datesByOrigin?.find(d => d.origin === origin);
    return {
      departureDate: match?.departureDate || dep.departureDate,
      returnDate: match?.returnDate || dep.returnDate,
    };
  };

  const getDurationForDates = (depISO: string, retISO: string) => {
    const days = diffDaysInclusive(depISO, retISO);
    const nightsFromTour = parseNightsFromDuration(selectedTour?.duration || '');
    const nights = nightsFromTour ?? (days > 0 ? Math.max(days - 1, 0) : 0);
    return days > 0 ? `${nights} Nights ${days} Days` : (selectedTour?.duration || '');
  };

  const daysWithGalleries = useMemo(() => {
    const days = selectedTour?.itinerary || [];
    return days.map((d) => ({
      day: d.day,
      key: String(d.day),
      title: d.title,
      imageUrls: (d.galleryImageUrls || []).slice(0, 3),
    }));
  }, [selectedTour]);

  useEffect(() => {
    async function loadData() {
      try {
        const allTours = await getTours();
        const filteredTours = allTours.filter(t => {
          const matchesCategory = t.productCategory === productCategory || t.productId?.startsWith(productCategory);
          const matchesType = !tourType || t.tourType === tourType || (tourType === 'special-event' && t.productId?.includes('special'));
          return matchesCategory && matchesType && t.isActive;
        });
        setTours(filteredTours);
        setSelectedTour(filteredTours[0] || null);
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productCategory, tourType]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex justify-center items-center" style={{ backgroundColor: theme.pageBg }}>
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  if (!selectedTour || !selectedTour.itinerary || selectedTour.itinerary.length === 0) {
    return (
      <section className="pt-32 pb-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
        <div className="container-custom">
          <h2 className="section-heading mb-8" style={{ color: theme.headingText }}>Tour Itinerary</h2>
          <div className="text-center py-20 card" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
            <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.headingText }}>No Itinerary Available</h3>
            <p className="text-lg" style={{ color: theme.mutedText }}>
              The detailed itinerary for this tour is being prepared. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  const hasDepartures = !!selectedTour.departures && selectedTour.departures.length > 0;
  const hasFlightRoutes = !!selectedTour.flightRoutes && selectedTour.flightRoutes.length > 0;
  const track = (name: string, params: Record<string, unknown>) => {
    void (async () => {
      const analytics = await initAnalytics();
      if (!analytics) return;
      logEvent(analytics, name, params);
    })();
  };

  return (
    <section className="pt-32 pb-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
      <div className="container-custom">
        <div className="mb-12">
          <h2 className="section-heading mb-4" style={{ color: theme.headingText }}>
            {selectedTour.title} - Daily Itinerary
          </h2>
          <p className="text-lg" style={{ color: theme.bodyText }}>
            An unforgettable journey packed with excitement and cultural experiences
          </p>
        </div>

        {/* Tour Selector (if multiple tours) */}
        {tours.length > 1 && (
          <div className="mb-12 flex flex-wrap gap-3">
            {tours.map(tour => (
              <button
                key={tour.id}
                onClick={() => setSelectedTour(tour)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                style={{
                  backgroundColor: selectedTour.id === tour.id ? theme.primaryBtnBg : theme.cardBg,
                  color: selectedTour.id === tour.id ? theme.primaryBtnText : theme.bodyText,
                  border: `1px solid ${selectedTour.id === tour.id ? theme.primaryBtnBg : theme.cardBg}`,
                }}
              >
                {tour.title}
              </button>
            ))}
          </div>
        )}

        {/* Flights & Dates (merged: departure dates + flight information) */}
        {hasDepartures && hasFlightRoutes ? (
          <div className="space-y-6 mb-16">
            <h3 className="text-2xl font-bold mb-2" style={{ color: theme.headingText }}>
              Flights & Dates
            </h3>
            <p className="mb-6" style={{ color: theme.mutedText }}>
              Choose your departure city to see the exact travel dates and flight schedule.
            </p>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              {selectedTour.flightRoutes.map((route, index) => {
                const departuresSorted = (selectedTour.departures || [])
                  .slice()
                  .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());

                const firstDep = departuresSorted[0];
                const firstDates = firstDep ? getDatesForOrigin(firstDep, route.origin) : null;
                const dateLine = firstDates
                  ? `${new Date(firstDates.departureDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} - ${new Date(firstDates.returnDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : '';

                const durationLine = firstDates
                  ? getDurationForDates(firstDates.departureDate, firstDates.returnDate)
                  : selectedTour.duration;

                return (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.08 }}
                    className="card p-8 relative overflow-hidden group"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}
                  >
                    <div className="absolute top-0 right-0 p-4 rounded-bl-2xl" style={{ backgroundColor: `${theme.goldColor}10` }}>
                      <Plane className="w-6 h-6" style={{ color: theme.goldColor }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: theme.headingText }}>
                      <span style={{ color: theme.goldColor }}>{route.origin.split(' ')[0]}</span>
                      <span style={{ color: theme.mutedText }}>to</span>
                      <span style={{ color: theme.headingText }}>{route.destination.split(' ')[0]}</span>
                    </h3>

                    {dateLine ? (
                      <div className="mb-6">
                        <div className="text-sm font-medium" style={{ color: theme.bodyText }}>
                          {dateLine}
                        </div>
                        <div className="text-xs mt-1" style={{ color: theme.mutedText }}>
                          {durationLine}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 text-xs" style={{ color: theme.mutedText }}>
                        {selectedTour.duration}
                      </div>
                    )}

                    <div className="space-y-8">
                      {/* Outbound */}
                      <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.goldColor }} />
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${theme.goldColor}10`, color: theme.goldColor }}
                          >
                            OUTBOUND
                          </span>
                          <span className="text-sm" style={{ color: theme.mutedText }}>
                            {route.airline} • {route.outbound.flightNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                              {route.outbound.departureTime}
                            </p>
                            <p className="text-sm" style={{ color: theme.mutedText }}>
                              {route.origin}
                            </p>
                          </div>
                          <div className="flex-1 px-4 flex flex-col items-center">
                            <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                              <Plane
                                className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                                style={{ color: theme.mutedText }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                              {route.outbound.arrivalTime}
                            </p>
                            <p className="text-sm" style={{ color: theme.mutedText }}>
                              {route.destination}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Inbound */}
                      <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.mutedText }} />
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: theme.secondaryBtnBg, color: theme.mutedText }}
                          >
                            RETURN
                          </span>
                          <span className="text-sm" style={{ color: theme.mutedText }}>
                            {route.airline} • {route.inbound.flightNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                              {route.inbound.departureTime}
                            </p>
                            <p className="text-sm" style={{ color: theme.mutedText }}>
                              {route.destination}
                            </p>
                          </div>
                          <div className="flex-1 px-4 flex flex-col items-center">
                            <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                              <Plane
                                className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                                style={{ color: theme.mutedText }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                              {route.inbound.arrivalTime}
                            </p>
                            <p className="text-sm" style={{ color: theme.mutedText }}>
                              {route.origin}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking options */}
                    <div className="mt-8 space-y-3">
                      {departuresSorted.length === 1 ? (
                        (() => {
                          const dep = departuresSorted[0];
                          const dates = getDatesForOrigin(dep, route.origin);
                          const isSoldOut = dep.status === 'sold-out';
                          return (
                            <Link
                              href={`/register?tourId=${selectedTour.id}&departureId=${dep.id}&origin=${encodeURIComponent(route.origin)}`}
                              className="w-full btn-primary justify-center"
                              style={{
                                opacity: isSoldOut ? 0.5 : 1,
                                pointerEvents: isSoldOut ? 'none' : 'auto',
                              }}
                              aria-disabled={isSoldOut}
                              onClick={() => {
                                if (isSoldOut) return;
                                track('book_click', {
                                  tour_id: selectedTour.id,
                                  departure_id: dep.id,
                                  origin: route.origin,
                                });
                              }}
                            >
                              {isSoldOut ? 'Sold Out' : `Book ${route.origin}`}
                              <span className="sr-only">
                                {' '}
                                {dates.departureDate} - {dates.returnDate}
                              </span>
                            </Link>
                          );
                        })()
                      ) : (
                        <div className="space-y-3">
                          {departuresSorted.map((dep) => {
                            const dates = getDatesForOrigin(dep, route.origin);
                            const isSoldOut = dep.status === 'sold-out';
                            return (
                              <div
                                key={`${route.id}-${dep.id}`}
                                className="rounded-xl border p-4"
                                style={{ borderColor: theme.secondaryBtnBorder, backgroundColor: `${theme.goldColor}06` }}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold" style={{ color: theme.headingText }}>
                                      {new Date(dates.departureDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}{' '}
                                      -{' '}
                                      {new Date(dates.returnDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: theme.mutedText }}>
                                      {getDurationForDates(dates.departureDate, dates.returnDate)}
                                      {dep.specialNote ? ` • ${dep.specialNote}` : ''}
                                    </div>
                                  </div>
                                  <Link
                                    href={`/register?tourId=${selectedTour.id}&departureId=${dep.id}&origin=${encodeURIComponent(route.origin)}`}
                                    className="btn-primary justify-center px-4 py-2 text-sm"
                                    style={{
                                      opacity: isSoldOut ? 0.5 : 1,
                                      pointerEvents: isSoldOut ? 'none' : 'auto',
                                    }}
                                    aria-disabled={isSoldOut}
                                    onClick={() => {
                                      if (isSoldOut) return;
                                      track('book_click', {
                                        tour_id: selectedTour.id,
                                        departure_id: dep.id,
                                        origin: route.origin,
                                      });
                                    }}
                                  >
                                    {isSoldOut ? 'Sold Out' : 'Book'}
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Available Departure Dates (fallback when no flight routes exist) */}
        {hasDepartures && !hasFlightRoutes && (
          <div className="space-y-6 mb-16">
            <h3 className="text-2xl font-bold mb-6" style={{ color: theme.headingText }}>
              Available Departure Dates
            </h3>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {selectedTour.departures
                .slice()
                .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
                .map((departure, index) => (
                  <motion.div
                    key={departure.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className={`card p-6 relative overflow-hidden ${
                      selectedTour.departures.length === 1 ? 'md:col-span-2' : ''
                    }`}
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}
                  >
                    <div className="space-y-4">
                      {/* Dates */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5" style={{ color: theme.goldColor }} />
                          <span className="text-sm font-medium" style={{ color: theme.mutedText }}>
                            Departure & Return
                          </span>
                        </div>

                        {flightOrigins.length > 1 && departure.datesByOrigin && departure.datesByOrigin.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wider" style={{ color: theme.mutedText }}>
                              Dates vary by departure city
                            </div>
                            <div className="space-y-1">
                              {flightOrigins.map((origin) => {
                                const d = getDatesForOrigin(departure, origin);
                                return (
                                  <div key={origin} className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="text-sm font-semibold" style={{ color: theme.headingText }}>
                                      {origin}
                                    </span>
                                    <span className="text-sm" style={{ color: theme.bodyText }}>
                                      {new Date(d.departureDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                      {' - '}
                                      {new Date(d.returnDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xl font-bold" style={{ color: theme.headingText }}>
                            {new Date(departure.departureDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {' - '}
                            {new Date(departure.returnDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {flightOrigins.length > 1 && departure.datesByOrigin && departure.datesByOrigin.length > 0 ? (
                        <div className="space-y-1">
                          {flightOrigins.map((origin) => {
                            const d = getDatesForOrigin(departure, origin);
                            return (
                              <div key={`dur-${departure.id}-${origin}`} className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="text-sm font-semibold" style={{ color: theme.headingText }}>
                                  {origin}
                                </span>
                                <span className="text-sm" style={{ color: theme.bodyText }}>
                                  {getDurationForDates(d.departureDate, d.returnDate)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: theme.goldColor }} />
                          <span style={{ color: theme.bodyText }}>{selectedTour.duration}</span>
                        </div>
                      )}

                      {/* Special Note */}
                      {departure.specialNote && (
                        <div className="pt-3 border-t" style={{ borderColor: theme.secondaryBtnBorder }}>
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5" style={{ color: theme.goldColor }} />
                            <p className="text-sm" style={{ color: theme.bodyText }}>
                              {departure.specialNote}
                            </p>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/register?tourId=${selectedTour.id}&departureId=${departure.id}`}
                        className="w-full mt-4 btn-primary justify-center"
                        style={{
                          opacity: departure.status === 'sold-out' ? 0.5 : 1,
                          pointerEvents: departure.status === 'sold-out' ? 'none' : 'auto',
                        }}
                      >
                        {departure.status === 'sold-out' ? 'Sold Out' : 'Book This Date'}
                      </Link>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Itinerary (left) + Photos (right) */}
        <div className="max-w-6xl mx-auto space-y-10">
          {selectedTour.itinerary.map((day, index) => {
            const dayKey = String(day.day);
            const imageUrls = (day.galleryImageUrls || []).slice(0, 3);
            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="grid md:grid-cols-2 gap-8 md:items-stretch md:min-h-[clamp(420px,34vw,520px)]"
              >
                {/* Left: Day content (always left-aligned) */}
                <div
                  className={`card p-6 md:p-8 transition-all duration-300 h-full flex flex-col min-h-0 ${
                    day.highlight ? 'border-2' : ''
                  }`}
                  style={{
                    borderColor: day.highlight ? `${theme.goldColor}60` : theme.cardBg,
                    backgroundColor: day.highlight ? `${theme.goldColor}10` : theme.cardBg,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm"
                      style={{
                        backgroundColor: day.highlight ? theme.goldColor : theme.secondaryBtnBg,
                        color: day.highlight ? theme.pageBg : theme.headingText,
                      }}
                    >
                      {day.day}
                    </span>
                    <span className="font-medium" style={{ color: theme.goldColor }}>
                      {day.date}
                    </span>
                    {day.highlight && <span className="text-xl">⭐</span>}
                  </div>

                  <h3 className="text-xl font-bold mb-4" style={{ color: theme.headingText }}>
                    {day.title}
                  </h3>

                  <ul
                    className="space-y-2 mb-6 flex-1 min-h-0 overflow-auto pr-2"
                    style={{ color: theme.bodyText }}
                  >
                    {day.activities.map((activity, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5" style={{ color: theme.goldColor }}>
                          •
                        </span>
                        <span className="flex-1">{activity}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: theme.secondaryBtnBorder }}>
                    {day.meals.breakfast && (
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}
                      >
                        <Utensils className="w-3 h-3" />
                        Breakfast
                      </span>
                    )}
                    {day.meals.lunch && (
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}
                      >
                        <Utensils className="w-3 h-3" />
                        Lunch
                      </span>
                    )}
                    {day.meals.dinner && (
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}
                      >
                        <Utensils className="w-3 h-3" />
                        Dinner
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Photos slider (max 3) */}
                <div className="md:pt-2 h-full min-h-0">
                  <ItineraryDayCarousel
                    dayKey={dayKey}
                    title={`Day ${day.day}: ${day.title}`}
                    imageUrls={imageUrls}
                    getIndex={getCarouselIndex}
                    setIndex={setCarouselIndex}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tour Duration Summary */}
        <div className="mt-16 text-center card p-8" style={{ backgroundColor: `${theme.goldColor}10`, borderColor: `${theme.goldColor}30` }}>
          <h3 className="text-2xl font-bold mb-4" style={{ color: theme.headingText }}>
            Complete {selectedTour.duration} Experience
          </h3>
          <p className="text-lg" style={{ color: theme.bodyText }}>
            Every moment carefully planned for your comfort and enjoyment
          </p>
        </div>

        {/* Flight Information (fallback when there are no departures rendered above) */}
        {!hasDepartures && selectedTour.flightRoutes && selectedTour.flightRoutes.length > 0 && (
          <div className="mt-20 space-y-6">
            <h3 className="text-2xl font-bold mb-6" style={{ color: theme.headingText }}>
              Flight Information
            </h3>
            <p className="mb-8" style={{ color: theme.mutedText }}>
              Comfortable flights with premium airlines. Choose your departure city.
            </p>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              {selectedTour.flightRoutes.map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.08 }}
                  className="card p-8 relative overflow-hidden group"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}
                >
                  <div className="absolute top-0 right-0 p-4 rounded-bl-2xl" style={{ backgroundColor: `${theme.goldColor}10` }}>
                    <Plane className="w-6 h-6" style={{ color: theme.goldColor }} />
                  </div>

                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: theme.headingText }}>
                    <span style={{ color: theme.goldColor }}>{route.origin.split(' ')[0]}</span>
                    <span style={{ color: theme.mutedText }}>to</span>
                    <span style={{ color: theme.headingText }}>{route.destination.split(' ')[0]}</span>
                  </h3>

                  <div className="space-y-8">
                    {/* Outbound */}
                    <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.goldColor }} />
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${theme.goldColor}10`, color: theme.goldColor }}
                        >
                          OUTBOUND
                        </span>
                        <span className="text-sm" style={{ color: theme.mutedText }}>
                          {route.airline} • {route.outbound.flightNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                            {route.outbound.departureTime}
                          </p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>
                            {route.origin}
                          </p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                            <Plane
                              className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                              style={{ color: theme.mutedText }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                            {route.outbound.arrivalTime}
                          </p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>
                            {route.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inbound */}
                    <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.mutedText }} />
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: theme.secondaryBtnBg, color: theme.mutedText }}
                        >
                          RETURN
                        </span>
                        <span className="text-sm" style={{ color: theme.mutedText }}>
                          {route.airline} • {route.inbound.flightNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                            {route.inbound.departureTime}
                          </p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>
                            {route.destination}
                          </p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                            <Plane
                              className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                              style={{ color: theme.mutedText }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                            {route.inbound.arrivalTime}
                          </p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>
                            {route.origin}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

