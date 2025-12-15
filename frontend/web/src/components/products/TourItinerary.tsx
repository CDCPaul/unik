'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Plane, Info, Utensils, RefreshCw } from 'lucide-react';
import { getTours } from '@/lib/services/tours';
import Link from 'next/link';
import type { TourPackage, TourDeparture } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

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

  return (
    <div className="card overflow-hidden" style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}>
      <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md relative">
        {has ? (
          <motion.img
            key={currentUrl}
            src={currentUrl}
            alt={title}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-dark-400">
            No photos uploaded for this day.
          </div>
        )}

        {has && imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex(dayKey, (idx - 1 + imageUrls.length) % imageUrls.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIndex(dayKey, (idx + 1) % imageUrls.length)}
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

        {/* Available Departure Dates (moved from Schedule tab) */}
        {selectedTour.departures && selectedTour.departures.length > 0 && (
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
                className="grid md:grid-cols-2 gap-8 items-start"
              >
                {/* Left: Day content (always left-aligned) */}
                <div
                  className={`card p-6 md:p-8 transition-all duration-300 ${
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

                  <ul className="space-y-2 mb-6" style={{ color: theme.bodyText }}>
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
                <div className="md:pt-2">
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

        {/* Flight Information (moved from Schedule tab) */}
        {selectedTour.flightRoutes && selectedTour.flightRoutes.length > 0 && (
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

